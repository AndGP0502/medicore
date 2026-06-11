#define MyAppName "MediCore"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "MediCore"
#define MyAppURL "http://localhost:5173"

[Setup]
AppId={{8F3A2B1C-4D5E-6F7A-8B9C-0D1E2F3A4B5C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\MediCore
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=installer
OutputBaseFilename=MediCore-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear icono en el escritorio"; GroupDescription: "Iconos adicionales:"

[Files]
; Backend ejecutable
Source: "backend\dist\medicore-backend.exe"; DestDir: "{app}\backend"; Flags: ignoreversion

; Frontend build
Source: "frontend\dist\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs

; Java JRE
Source: "C:\Users\USER\Desktop\OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10\jdk-17.0.19+10\*"; DestDir: "{app}\jdk"; Flags: ignoreversion recursesubdirs createallsubdirs

; Firmador Java
Source: "backend\java_signer\FirmadorSRI.class"; DestDir: "{app}\java_signer"; Flags: ignoreversion

; Certificados (carpeta vacia para que el cliente suba su .p12)
Source: "backend\certificados\*"; DestDir: "{app}\certificados"; Flags: ignoreversion recursesubdirs createallsubdirs

; Scripts de inicio
Source: "iniciar.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\MediCore"; Filename: "{app}\iniciar.bat"; IconFilename: "{app}\backend\medicore-backend.exe"
Name: "{group}\Desinstalar MediCore"; Filename: "{uninstallexe}"
Name: "{commondesktop}\MediCore"; Filename: "{app}\iniciar.bat"; Tasks: desktopicon

[Run]
Filename: "{app}\iniciar.bat"; Description: "Iniciar MediCore"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
  begin
    MsgBox('MediCore se instalara en su computadora. Asegurese de tener Docker Desktop instalado y corriendo.', mbInformation, MB_OK);
  end;
end;
