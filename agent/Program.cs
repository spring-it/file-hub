using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Session;

namespace FileHub.EtwAgent;

internal static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static async Task<int> Main(string[] args)
    {
        if (args.Contains("--self-test", StringComparer.OrdinalIgnoreCase))
            return SelfTest();
        if (!OperatingSystem.IsWindows())
            return 10;

        var pipeName = ReadArg(args, "--pipe-name");
        if (string.IsNullOrWhiteSpace(pipeName))
        {
            Console.Error.WriteLine("Missing --pipe-name.");
            return 11;
        }

        try
        {
            return await RunAsync(pipeName);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex);
            return 12;
        }
    }

    private static async Task<int> RunAsync(string pipeName)
    {
        await using var pipe = new NamedPipeClientStream(".", pipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
        await pipe.ConnectAsync(20000);
        using var reader = new StreamReader(pipe, new UTF8Encoding(false), false, 4096, leaveOpen: true);
        using var writer = new StreamWriter(pipe, new UTF8Encoding(false), 4096, leaveOpen: true) { AutoFlush = true };

        var initialLine = await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(15));
        var initial = initialLine is null ? null : JsonSerializer.Deserialize<ControlMessage>(initialLine, JsonOptions);
        if (initial is null || !string.Equals(initial.Type, "configure", StringComparison.OrdinalIgnoreCase))
        {
            await writer.WriteLineAsync(JsonSerializer.Serialize(new AgentMessage { Type = "error", Message = "Missing initial monitor configuration." }, JsonOptions));
            return 13;
        }

        var targets = new ConcurrentDictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var processOwners = new ConcurrentDictionary<int, string>();
        var recentEvents = new ConcurrentDictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        var events = Channel.CreateBounded<AgentMessage>(new BoundedChannelOptions(2048)
        {
            SingleReader = true,
            SingleWriter = false,
            FullMode = BoundedChannelFullMode.DropOldest
        });

        void Configure(IEnumerable<ProgramTarget>? programs)
        {
            targets.Clear();
            foreach (var program in programs ?? Array.Empty<ProgramTarget>())
            {
                var key = NormalizePath(program.ExePath);
                if (key.Length > 0 && !string.IsNullOrWhiteSpace(program.Name))
                    targets[key] = program.Name.Trim();
            }

            processOwners.Clear();
            foreach (var process in Process.GetProcesses())
            {
                try
                {
                    var image = process.MainModule?.FileName;
                    if (!string.IsNullOrWhiteSpace(image) && targets.TryGetValue(NormalizePath(image), out var name))
                        processOwners[process.Id] = name;
                }
                catch
                {
                    // Protected and short-lived processes may not expose MainModule.
                }
                finally
                {
                    process.Dispose();
                }
            }
        }

        Configure(initial.Programs);

        void EmitFileEvent(int processId, string? fileName)
        {
            if (processId <= 0 || string.IsNullOrWhiteSpace(fileName) || !Path.IsPathRooted(fileName))
                return;
            if (!processOwners.TryGetValue(processId, out var sourceApp))
                return;

            var key = processId.ToString() + "|" + fileName;
            var now = Stopwatch.GetTimestamp();
            if (recentEvents.TryGetValue(key, out var last) && now - last < Stopwatch.Frequency / 2)
                return;
            recentEvents[key] = now;
            if (recentEvents.Count > 20000)
            {
                foreach (var item in recentEvents)
                    if (now - item.Value > Stopwatch.Frequency * 10)
                        recentEvents.TryRemove(item.Key, out _);
            }

            events.Writer.TryWrite(new AgentMessage
            {
                Type = "file-io",
                FileName = fileName,
                SourceApp = sourceApp,
                ProcessId = processId
            });
        }

        // Kernel ETW sessions must be enabled before accessing session.Source.
        using var session = new TraceEventSession(KernelTraceEventParser.KernelSessionName);
        try
        {
            session.EnableKernelProvider(
                KernelTraceEventParser.Keywords.Process |
                KernelTraceEventParser.Keywords.FileIO |
                KernelTraceEventParser.Keywords.FileIOInit |
                KernelTraceEventParser.Keywords.DiskFileIO);
        }
        catch (Exception ex)
        {
            await writer.WriteLineAsync(JsonSerializer.Serialize(new AgentMessage
            {
                Type = "error",
                Message = "Windows ETW could not be started. Administrator permission may have been declined or another kernel trace session is active: " + ex.Message
            }, JsonOptions));
            return 14;
        }

        var source = session.Source;
        source.Kernel.ProcessStart += data =>
        {
            var image = data.ImageFileName;
            if (!string.IsNullOrWhiteSpace(image) && targets.TryGetValue(NormalizePath(image), out var name))
                processOwners[data.ProcessID] = name;
            else if (processOwners.TryGetValue(data.ParentID, out var parentName))
                processOwners[data.ProcessID] = parentName;
        };
        source.Kernel.ProcessStop += data => processOwners.TryRemove(data.ProcessID, out _);
        source.Kernel.FileIOCreate += data => EmitFileEvent(data.ProcessID, data.FileName);
        source.Kernel.FileIOWrite += data => EmitFileEvent(data.ProcessID, data.FileName);
        source.Kernel.FileIORename += data => EmitFileEvent(data.ProcessID, data.FileName);

        var writerTask = Task.Run(async () =>
        {
            await foreach (var message in events.Reader.ReadAllAsync())
                await writer.WriteLineAsync(JsonSerializer.Serialize(message, JsonOptions));
        });

        await writer.WriteLineAsync(JsonSerializer.Serialize(new AgentMessage { Type = "ready" }, JsonOptions));

        var readerTask = Task.Run(async () =>
        {
            try
            {
                string? line;
                while ((line = await reader.ReadLineAsync()) is not null)
                {
                    var control = JsonSerializer.Deserialize<ControlMessage>(line, JsonOptions);
                    if (control is not null && string.Equals(control.Type, "configure", StringComparison.OrdinalIgnoreCase))
                        Configure(control.Programs);
                }
            }
            catch (IOException)
            {
                // The desktop app has closed its local pipe.
            }
            finally
            {
                source.StopProcessing();
            }
        });

        try
        {
            source.Process();
        }
        catch (Exception ex)
        {
            events.Writer.TryWrite(new AgentMessage { Type = "error", Message = "ETW file event processing stopped: " + ex.Message });
        }
        finally
        {
            events.Writer.TryComplete();
        }

        try { await writerTask; } catch (IOException) { }
        try { await readerTask; } catch (IOException) { }
        return 0;
    }

    private static string ReadArg(string[] args, string key)
    {
        for (var i = 0; i + 1 < args.Length; i++)
            if (string.Equals(args[i], key, StringComparison.OrdinalIgnoreCase))
                return args[i + 1];
        return "";
    }

    private static string NormalizePath(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "";
        var normalized = value.Trim().Replace('/', '\\');
        try
        {
            normalized = Path.GetFullPath(normalized);
        }
        catch
        {
            // Keep device paths as supplied by ETW when they cannot be resolved as DOS paths.
        }
        return normalized.TrimEnd('\\').ToUpperInvariant();
    }

    private static int SelfTest()
    {
        var target = NormalizePath(@"C:\Program Files\Example\client.exe");
        if (target != NormalizePath(@"c:/program files/example/CLIENT.EXE"))
            return Fail("Windows path matching is not case-insensitive.");
        if (target == NormalizePath(@"C:\Other\client.exe"))
            return Fail("Different executable paths must not match.");
        if (NormalizePath("") != "")
            return Fail("Empty executable paths must not match.");
        Console.WriteLine("File Hub ETW agent self-test passed.");
        return 0;
    }

    private static int Fail(string message)
    {
        Console.Error.WriteLine(message);
        return 1;
    }

    private sealed class ControlMessage
    {
        public string Type { get; set; } = "";
        public List<ProgramTarget>? Programs { get; set; }
    }

    private sealed class ProgramTarget
    {
        public string Name { get; set; } = "";
        public string ExePath { get; set; } = "";
    }

    private sealed class AgentMessage
    {
        public string Type { get; set; } = "";
        public string? FileName { get; set; }
        public string? SourceApp { get; set; }
        public int? ProcessId { get; set; }
        public string? Message { get; set; }
    }
}
