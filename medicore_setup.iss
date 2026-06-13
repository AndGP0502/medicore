; medicore_setup.iss
; Instalador de MediCore para Windows
; Compilar con Inno Setup 6+ (https://jrsoftware.org/isinfo.php)
; Antes de compilar: correr empaquetar.ps1 para generar dist\MediCore\

#define MyAppName "MediCore"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "TOQ"
#define MyAppURL "http://localhost:8000"
#define MyAppExeName "MediCore.exe"
#define MyAppId "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}"

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Instalar en Archivos de programa (requiere privilegios de admin)
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Datos del usuario VAN A APPDATA (no en Archivos de programa)
; El launcher los crea automáticamente la primera vez.

OutputDir=dist_installer
OutputBaseFilename=MediCore_Setup_v{#MyAppVersion}
SetupIconFile=medicore.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

; Imágenes del asistente (opcionales — comentar si no tienes)
; WizardImageFile=setup_banner.bmp
; WizardSmallImageFile=setup_icon.bmp

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon";  Description: "Crear icono en el Escritorio"; GroupDescription: "Iconos adicionales:"; Flags: unchecked
Name: "startupicon";  Description: "Iniciar MediCore automáticamente con Windows"; GroupDescription: "Inicio:"; Flags: unchecked

[Files]
; Todo el bundle de PyInstaller
Source: "dist\MediCore\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Ícono (si existe)
Source: "medicore.ico"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
; Menú Inicio
Name: "{group}\{#MyAppName}";            Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\medicore.ico"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

; Escritorio (opcional)
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\medicore.ico"; Tasks: desktopicon

; Inicio de Windows (opcional)
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startupicon

[Run]
; Abrir MediCore al finalizar la instalación
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir MediCore ahora"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Al desinstalar, detener MediCore si está corriendo
Filename: "taskkill"; Parameters: "/IM {#MyAppExeName} /F"; Flags: runhidden skipifdoesntexist

[UninstallDelete]
; Borrar archivos de log (los datos del usuario en APPDATA se conservan)
Type: filesandordirs; Name: "{app}\logs"

[Code]
// ── Verificación de Windows 10+ ───────────────────────────────────────────────
function InitializeSetup(): Boolean;
var
  Version: TWindowsVersion;
begin
  GetWindowsVersionEx(Version);
  if (Version.Major < 10) then
  begin
    MsgBox('MediCore requiere Windows 10 o superior.', mbError, MB_OK);
    Result := False;
    Exit;
  end;
  Result := True;
end;

// ── Mensaje de bienvenida con instrucciones ───────────────────────────────────
procedure InitializeWizard();
begin
  WizardForm.WelcomeLabel2.Caption :=
    'Este asistente instalará MediCore en su equipo.' + #13#10 + #13#10 +
    'MediCore incluye su propia base de datos (PostgreSQL portable). ' +
    'No necesita instalar Docker, PostgreSQL ni ningún otro software.' + #13#10 + #13#10 +
    'Sus datos se guardarán en:' + #13#10 +
    '  %APPDATA%\MediCore\' + #13#10 + #13#10 +
    'Haga clic en Siguiente para continuar.';
end;

// ── Al finalizar: mostrar URL ─────────────────────────────────────────────────
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssDone then
  begin
    MsgBox(
      'MediCore se ha instalado correctamente.' + #13#10 + #13#10 +
      'Cuando abra la aplicación, se iniciará automáticamente y se abrirá en su navegador.' + #13#10 +
      'La primera vez puede tardar hasta 30 segundos en estar lista.' + #13#10 + #13#10 +
      'Dirección de acceso: http://localhost:8000',
      mbInformation, MB_OK
    );
  end;
end;
