!macro customInstall
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\scripts\register-native-host.ps1" -InstallDir "$INSTDIR"'
!macroend
!macro customUnInstall
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\scripts\register-native-host.ps1" -InstallDir "$INSTDIR" -Uninstall'
!macroend
