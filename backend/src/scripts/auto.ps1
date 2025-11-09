# =====================================================
# PowerShell script to register admin, login, and create products sequentially
# =====================================================

# Config
$ApiBase = "http://localhost:9001/api"
$AdminUser = @{
    username = "admin_user_test"
    password = "SuperSecure123!"
}
$Products = @(
    @{ name="Coffee Latte"; description="Smooth milk coffee"; price=3.50; category="Coffee"; tags="hot, milk"; image_url=""; is_active=$true; extra_info="";},
    @{ name="Matcha Cappuccino"; description="Green tea latte"; price=4.00; category="Tea"; tags="hot, green"; image_url=""; is_active=$true; extra_info="";},
    @{ name="Dark Mocha"; description="Chocolate coffee"; price=4.50; category="Coffee"; tags="hot, chocolate"; image_url=""; is_active=$true; extra_info="";}
)

$Headers = @{}

# -------------------------
# Helper: POST JSON
# -------------------------
function Invoke-PostJson($Url, $Body, $Headers=@{}) {
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Post -Body ($Body | ConvertTo-Json -Depth 5) -ContentType "application/json" -Headers $Headers -TimeoutSec 10
        return $response
    } catch {
        Write-Host "[ERROR] POST $Url failed: $_"
        return $null
    }
}

# -------------------------
# Register admin user
# -------------------------
Write-Host "[STEP] Registering user: $($AdminUser.username)"
$response = Invoke-PostJson "$ApiBase/auth/register" $AdminUser
if ($response -ne $null) {
    Write-Host "[SUCCESS] User registered."
} else {
    Write-Host "[WARNING] Could not register user (maybe already exists)."
}

# -------------------------
# Login
# -------------------------
Write-Host "[STEP] Logging in: $($AdminUser.username)"
$loginResp = Invoke-PostJson "$ApiBase/auth/login" $AdminUser
if ($loginResp -ne $null) {
    Write-Host "[SUCCESS] Token received."
    # Assuming token is in "token" field in JSON
    $Token = $loginResp.token
    $Headers = @{ Authorization = "Bearer $Token" }
} else {
    Write-Host "[ERROR] Login failed, cannot continue."
    exit 1
}

# -------------------------
# Create products sequentially
# -------------------------
Write-Host "[STEP] Creating products..."
foreach ($prod in $Products) {
    $result = Invoke-PostJson "$ApiBase/admin/products" $prod $Headers
    if ($result -ne $null) {
        Write-Host "[SUCCESS] Created product: $($prod.name)"
    } else {
        Write-Host "[ERROR] Failed to create product: $($prod.name)"
    }
    Start-Sleep -Milliseconds 200 # small delay to avoid SQLite locking issues
}

Write-Host "[SUCCESS] DONE. Admin script completed."
