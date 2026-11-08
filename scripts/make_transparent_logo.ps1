Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Naresh S\.gemini\antigravity\brain\4dcbec07-0d3d-4498-bdf5-bfa91e15449b\.user_uploaded\media_1794116441216_9be199d8.jpg"
$destPathFrontend = "frontend\img\simats_logo.png"
$destPathPublic = "public\img\simats_logo.png"

$origBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $origBmp.Width
$height = $origBmp.Height

$transBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($transBmp)
$graphics.DrawImage($origBmp, 0, 0, $width, $height)
$graphics.Dispose()
$origBmp.Dispose()

$visited = New-Object 'bool[,]' $width, $height
$qX = New-Object System.Collections.Generic.Queue[int]
$qY = New-Object System.Collections.Generic.Queue[int]

function EnqueueBorderPixel([int]$x, [int]$y) {
    if ($x -ge 0 -and $x -lt $width -and $y -ge 0 -and $y -lt $height) {
        if (-not $visited[$x, $y]) {
            $visited[$x, $y] = $true
            $pixel = $transBmp.GetPixel($x, $y)
            if ($pixel.R -ge 220 -and $pixel.G -ge 220 -and $pixel.B -ge 220) {
                $qX.Enqueue($x)
                $qY.Enqueue($y)
            }
        }
    }
}

for ($x = 0; $x -lt $width; $x++) {
    EnqueueBorderPixel $x 0
    EnqueueBorderPixel $x ($height - 1)
}
for ($y = 0; $y -lt $height; $y++) {
    EnqueueBorderPixel 0 $y
    EnqueueBorderPixel ($width - 1) $y
}

$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$cleared = 0

$dx = @(1, -1, 0, 0)
$dy = @(0, 0, 1, -1)

while ($qX.Count -gt 0) {
    $curX = $qX.Dequeue()
    $curY = $qY.Dequeue()
    $transBmp.SetPixel($curX, $curY, $transparent)
    $cleared++

    for ($i = 0; $i -lt 4; $i++) {
        $nx = $curX + $dx[$i]
        $ny = $curY + $dy[$i]

        if ($nx -ge 0 -and $nx -lt $width -and $ny -ge 0 -and $ny -lt $height) {
            if (-not $visited[$nx, $ny]) {
                $visited[$nx, $ny] = $true
                $px = $transBmp.GetPixel($nx, $ny)
                if ($px.R -ge 215 -and $px.G -ge 215 -and $px.B -ge 215) {
                    $qX.Enqueue($nx)
                    $qY.Enqueue($ny)
                }
            }
        }
    }
}

Write-Host "Cleared $cleared background pixels cleanly!"

# Feather borders
for ($x = 1; $x -lt ($width - 1); $x++) {
    for ($y = 1; $y -lt ($height - 1); $y++) {
        $p = $transBmp.GetPixel($x, $y)
        if ($p.A -gt 0) {
            $isNearEdge = ($transBmp.GetPixel($x+1, $y).A -eq 0) -or
                          ($transBmp.GetPixel($x-1, $y).A -eq 0) -or
                          ($transBmp.GetPixel($x, $y+1).A -eq 0) -or
                          ($transBmp.GetPixel($x, $y-1).A -eq 0)
            if ($isNearEdge -and $p.R -gt 200 -and $p.G -gt 200 -and $p.B -gt 200) {
                $avg = ($p.R + $p.G + $p.B) / 3
                $alpha = [int]([Math]::Max(0, 255 - ($avg - 200) * 4.5))
                $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            }
        }
    }
}

$transBmp.Save($destPathFrontend, [System.Drawing.Imaging.ImageFormat]::Png)
$transBmp.Save($destPathPublic, [System.Drawing.Imaging.ImageFormat]::Png)
$transBmp.Dispose()

Write-Host "SUCCESS: Transparent logo saved to $destPathFrontend and $destPathPublic"
