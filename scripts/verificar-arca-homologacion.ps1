param(
    [Parameter(Mandatory)] [ValidatePattern('^\d{11}$')] [string]$Cuit,
    [Parameter(Mandatory)] [ValidateRange(1, 99999)] [int]$PuntoVenta,
    [Parameter(Mandatory)] [ValidateSet('A', 'B')] [string]$Tipo,
    [Parameter(Mandatory)] [string]$CertificadoPfx
)

$ErrorActionPreference = 'Stop'

function Invoke-Soap([string]$Url, [string]$Action, [string]$Body) {
    $parameters = @{
        Uri = $Url
        Method = 'Post'
        TimeoutSec = 20
        MaximumRedirection = 0
        ContentType = 'text/xml; charset=utf-8'
        Headers = @{ SOAPAction = '"' + $Action + '"' }
        Body = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' + $Body + '</soap:Body></soap:Envelope>'
        SkipHttpErrorCheck = $true
    }
    $response = Invoke-WebRequest @parameters
    [xml]$document = $response.Content
    $fault = $document.SelectSingleNode("//*[local-name()='Fault']/*[local-name()='faultcode']")
    if ($fault) { throw "El servicio de homologación respondió con error SOAP ($($fault.InnerText))." }
    if ($response.StatusCode -ne 200) { throw "El servicio de homologación respondió HTTP $($response.StatusCode)." }
    return $document
}

$certificatePath = (Resolve-Path -LiteralPath $CertificadoPfx).Path
Add-Type -AssemblyName System.Security.Cryptography.Pkcs
$password = Read-Host 'Contraseña del PFX de homologación' -AsSecureString
$certificate = $null
try {
    $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
        $certificatePath, $password,
        [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet
    )
    if (!$certificate.HasPrivateKey) { throw 'El PFX debe contener la clave privada del certificado de homologación.' }
    $now = [DateTimeOffset]::UtcNow
    $uniqueId = $now.ToUnixTimeSeconds()
    $generation = $now.AddMinutes(-5).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $expiration = $now.AddMinutes(10).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $request = @"
<loginTicketRequest version="1.0">
  <header><uniqueId>$uniqueId</uniqueId><generationTime>$generation</generationTime><expirationTime>$expiration</expirationTime></header>
  <service>wsfe</service>
</loginTicketRequest>
"@
    $content = [System.Security.Cryptography.Pkcs.ContentInfo]::new([Text.Encoding]::UTF8.GetBytes($request))
    $signed = [System.Security.Cryptography.Pkcs.SignedCms]::new($content)
    $signer = [System.Security.Cryptography.Pkcs.CmsSigner]::new($certificate)
    $signer.IncludeOption = [System.Security.Cryptography.X509Certificates.X509IncludeOption]::EndCertOnly
    $signer.DigestAlgorithm = [System.Security.Cryptography.Oid]::new('1.3.14.3.2.26')
    $signed.ComputeSignature($signer)
    $cms = [Convert]::ToBase64String($signed.Encode())

    $login = Invoke-Soap 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms' 'urn:LoginCms' @"
<loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov"><in0>$cms</in0></loginCms>
"@
    $ticketNode = $login.SelectSingleNode("//*[local-name()='loginCmsReturn']")
    if (!$ticketNode) { throw 'WSAA no devolvió un ticket de acceso.' }
    [xml]$ticket = $ticketNode.InnerText
    $token = [Security.SecurityElement]::Escape($ticket.loginTicketResponse.credentials.token)
    $signature = [Security.SecurityElement]::Escape($ticket.loginTicketResponse.credentials.sign)
    if (!$token -or !$signature) { throw 'El ticket de WSAA está incompleto.' }

    $code = if ($Tipo -eq 'A') { 1 } else { 6 }
    $namespace = 'http://ar.gov.afip.dif.FEV1/'
    $response = Invoke-Soap 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx' ($namespace + 'FECompUltimoAutorizado') @"
<FECompUltimoAutorizado xmlns="$namespace">
  <Auth><Token>$token</Token><Sign>$signature</Sign><Cuit>$Cuit</Cuit></Auth>
  <PtoVta>$PuntoVenta</PtoVta><CbteTipo>$code</CbteTipo>
</FECompUltimoAutorizado>
"@
    $result = $response.SelectSingleNode("//*[local-name()='FECompUltimoAutorizadoResult']")
    if (!$result) { throw 'WSFE no devolvió el resultado de la consulta.' }
    $errorCode = $result.SelectSingleNode("./*[local-name()='Errors']/*/*[local-name()='Code']")
    if ($errorCode) { throw "WSFE rechazó la consulta (código $($errorCode.InnerText))." }
    $number = $result.SelectSingleNode("./*[local-name()='CbteNro']")
    if (!$number) { throw 'WSFE no devolvió la numeración.' }
    [pscustomobject]@{
        Ambiente = 'Homologación'
        PuntoVenta = $PuntoVenta
        Tipo = $Tipo
        UltimoAutorizado = [long]$number.InnerText
    }
} finally {
    if ($certificate) { $certificate.Dispose() }
    $password.Dispose()
}