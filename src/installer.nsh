!include "LogicLib.nsh"

RequestExecutionLevel admin

Section "Install Dependencies"

    ${IfNot} ${Silent}
        ExecWait '"$INSTDIR\DXSETUP.exe"'
        ExecWait '"$INSTDIR\VisualCppRedist_AIO_x86_x64.exe"'
    ${EndIf}

SectionEnd