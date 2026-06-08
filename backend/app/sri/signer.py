import subprocess
import os
import tempfile

JAVA_EXE = r"C:\Users\USER\Desktop\OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10\jdk-17.0.19+10\bin\java.exe"
JAVA_SIGNER_DIR = r"C:\Users\USER\Desktop\medicore\backend\java_signer"


def firmar_xml(xml_content: str, ruta_p12: str, clave_p12: str) -> str:
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.xml', delete=False) as f:
        f.write(xml_content.encode('utf-8'))
        xml_temp = f.name

    # Archivo de salida temporal
    xml_out = xml_temp + "_firmado.xml"

    try:
        result = subprocess.run(
            [JAVA_EXE, "-Dfile.encoding=UTF-8", "-cp", JAVA_SIGNER_DIR, "FirmadorSRI", xml_temp, ruta_p12, clave_p12, xml_out],
            capture_output=True,
            timeout=30
        )

        print(f"=== Java returncode: {result.returncode}")
        stderr = result.stderr.decode('utf-8', errors='replace') if result.stderr else ''
        print(f"=== Java stderr: {stderr[:300] if stderr else 'none'}")

        if result.returncode != 0:
            raise Exception(f"Error Java: {stderr}")

        # Leer desde archivo de salida en UTF-8
        if os.path.exists(xml_out):
            with open(xml_out, 'r', encoding='utf-8') as f:
                xml_firmado = f.read().strip()
        else:
            # Fallback: leer stdout
            xml_firmado = result.stdout.decode('utf-8', errors='replace').strip()

        print(f"=== Java output length: {len(xml_firmado)}")

        if not xml_firmado or "<Signature" not in xml_firmado:
            raise Exception(f"Java no genero firma. Output: {xml_firmado[:300]}")

        return xml_firmado

    finally:
        if os.path.exists(xml_temp):
            os.unlink(xml_temp)
        if os.path.exists(xml_out):
            os.unlink(xml_out)
