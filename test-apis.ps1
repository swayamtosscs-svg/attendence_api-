# PowerShell script to test Chat & Profile Picture APIs

$BASE_URL = "http://localhost:8087"

Write-Host "=== Testing Chat & Profile Picture APIs ===" -ForegroundColor Green
Write-Host ""

# Step 1: Login to get token
Write-Host "1. Login to get token..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@example.com"
    password = "your_password_here"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

Write-Host "Login Response:" -ForegroundColor Cyan
$loginResponse | ConvertTo-Json
Write-Host ""

# Extract token
$TOKEN = $loginResponse.token
if (-not $TOKEN) {
    Write-Host "ERROR: No token received. Please check login credentials." -ForegroundColor Red
    exit
}

Write-Host "Token: $TOKEN" -ForegroundColor Green
Write-Host ""

Write-Host "=== Testing Chat APIs ===" -ForegroundColor Green
Write-Host ""

# Test 2: Send Message
Write-Host "2. Testing Send Message API..." -ForegroundColor Yellow
$messageBody = @{
    recipientId = "69158b77bf21223e78398dc9"
    content = "Hello! This is a test message"
} | ConvertTo-Json

try {
    $sendMsgResponse = Invoke-RestMethod -Uri "$BASE_URL/api/chat/messages" `
        -Method POST `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -Body $messageBody
    
    Write-Host "Success:" -ForegroundColor Green
    $sendMsgResponse | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Conversations
Write-Host "3. Testing Get Conversations API..." -ForegroundColor Yellow
try {
    $conversationsResponse = Invoke-RestMethod -Uri "$BASE_URL/api/chat/conversations" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    Write-Host "Success:" -ForegroundColor Green
    $conversationsResponse | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Messages
Write-Host "4. Testing Get Messages API..." -ForegroundColor Yellow
try {
    $messagesResponse = Invoke-RestMethod -Uri "$BASE_URL/api/chat/messages?limit=10" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    Write-Host "Success:" -ForegroundColor Green
    $messagesResponse | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Testing Profile Picture APIs ===" -ForegroundColor Green
Write-Host ""

# Test 5: Upload Profile Picture
Write-Host "5. Testing Upload Profile Picture API..." -ForegroundColor Yellow
$imagePath = "test.jpg"
if (Test-Path $imagePath) {
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $fileContent = [System.IO.File]::ReadAllBytes($imagePath)
        $fileName = Split-Path $imagePath -Leaf
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: image/jpeg",
            "",
            [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent),
            "--$boundary--"
        )
        $body = $bodyLines -join "`r`n"
        
        $uploadResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users/me/avatar" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $TOKEN"
                "Content-Type" = "multipart/form-data; boundary=$boundary"
            } `
            -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body))
        
        Write-Host "Success:" -ForegroundColor Green
        $uploadResponse | ConvertTo-Json
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping: test.jpg not found. Create a test image file first." -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Delete Profile Picture
Write-Host "6. Testing Delete Profile Picture API..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users/me/avatar" `
        -Method DELETE `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    Write-Host "Success:" -ForegroundColor Green
    $deleteResponse | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== All Tests Complete ===" -ForegroundColor Green


