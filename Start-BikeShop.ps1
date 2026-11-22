# Startet einen lokalen Static-Server fuer den SIGNATO BikeShop auf localhost:8124
# localhost = sicherer Kontext. TcpListener statt HttpListener: keine Admin-Rechte noetig.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{ ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8";
           ".css" = "text/css"; ".json" = "application/json"; ".png" = "image/png";
           ".jpg" = "image/jpeg"; ".ico" = "image/x-icon" }

$server = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 8124)
$server.Start()
Write-Host "SIGNATO BikeShop laeuft auf http://localhost:8124  (Strg+C zum Beenden)"
Start-Process "http://localhost:8124/index.html"

while ($true) {
  $client = $server.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $requestLine = $reader.ReadLine()
    while (($line = $reader.ReadLine()) -ne $null -and $line -ne "") { }

    $path = [System.Uri]::UnescapeDataString(($requestLine -split ' ')[1])
    $path = $path.TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
    $file = Join-Path $root $path

    if ((Test-Path $file) -and -not $path.Contains("..")) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ct = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404")
      $head = "HTTP/1.1 404 Not Found`r`nContent-Length: 3`r`nConnection: close`r`n`r`n"
    }
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    $stream.Write($bytes, 0, $bytes.Length)
  } catch { }
  $client.Close()
}
