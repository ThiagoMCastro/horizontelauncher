!include "LogicLib.nsh"
!include "FileFunc.nsh"

RequestExecutionLevel admin

Section "Install Dependencies"
    SetOutPath "$INSTDIR"

    ; Execute DXSETUP.exe
    IfFileExists "$INSTDIR\DXSETUP.exe" 0 +2
    ExecWait '"$INSTDIR\DXSETUP.exe"'

    ; Execute VisualCppRedist_AIO_x86_x64.exe
    IfFileExists "$INSTDIR\VisualCppRedist_AIO_x86_x64.exe" 0 +2
    ExecWait '"$INSTDIR\VisualCppRedist_AIO_x86_x64.exe"'
SectionEnd