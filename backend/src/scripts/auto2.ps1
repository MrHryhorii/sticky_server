# =====================================================
# PowerShell Script: Full API Flow Test (Admin & User)
# =====================================================

# Config
$ApiBase = "http://localhost:9001/api"
# --- Admin User
$AdminUser = @{
    username = "admin_user_test"
    password = "SuperSecure123!"
}
# --- New Standard User
$NewUser = @{
    username = "new_customer_test"
    password = "CustomerPass456!"
}
# --- Product Data
$Products = @(
    @{ name="Coffee Latte"; description="Smooth milk coffee"; price=3.50; category="Coffee"; tags="hot, milk"; image_url=""; is_active=$true; extra_info="";},
    @{ name="Matcha Cappuccino"; description="Green tea latte"; price=4.00; category="Tea"; tags="hot, green"; image_url=""; is_active=$true; extra_info="";},
    @{ name="Dark Mocha"; description="Chocolate coffee"; price=4.50; category="Coffee"; tags="hot, chocolate"; image_url=""; is_active=$true; extra_info="";}
)

# Variables to store tokens and headers
$AdminToken = $null
$AdminHeaders = @{}
$UserToken = $null
$UserHeaders = @{}
$ProductId = $null
$NewOrderId = $null

# --- Helper functions (Invoke-PostJson, Invoke-GetJson) ---

# -------------------------
# Helper: POST JSON
# -------------------------
function Invoke-PostJson($Url, $Body, $Headers=@{}) {
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Post -Body ($Body | ConvertTo-Json -Depth 5) -ContentType "application/json" -Headers $Headers -TimeoutSec 10
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__ 
        $errorMessage = $_.Exception.Response.GetResponseStream() 
        $reader = New-Object System.IO.StreamReader($errorMessage)
        $responseBody = $reader.ReadToEnd()

        Write-Host "[ERROR] POST $Url failed."
        Write-Host "  -> Status Code: $statusCode"
        Write-Host "  -> Server Response: $responseBody"
        return $null
    }
}

# -------------------------
# Helper: GET JSON
# -------------------------
function Invoke-GetJson($Url, $Headers=@{}) {
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -ContentType "application/json" -Headers $Headers -TimeoutSec 10
        return $response
    } catch {
        Write-Host "[ERROR] GET $Url failed: $($_.Exception.Message)"
        return $null
    }
}

# -------------------------
# Helper: PUT JSON
# -------------------------
function Invoke-PutJson($Url, $Body, $Headers=@{}) {
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Put -Body ($Body | ConvertTo-Json -Depth 5) -ContentType "application/json" -Headers $Headers -TimeoutSec 10
        return $response
    } catch {
        # Обробка помилки з деталями
        $statusCode = $_.Exception.Response.StatusCode.value__ 
        $errorMessage = $_.Exception.Response.GetResponseStream() 
        $reader = New-Object System.IO.StreamReader($errorMessage)
        $responseBody = $reader.ReadToEnd()
        Write-Host "[ERROR] PUT $Url failed."
        Write-Host "  -> Status Code: $statusCode"
        Write-Host "  -> Server Response: $responseBody"
        return $null
    }
}

# -------------------------
# Helper: POST RAW JSON
# -------------------------
function Invoke-PostJsonRaw($Url, $JsonString, $Headers=@{}) {
    try {
        # Ця функція приймає ВЖЕ готовий JSON-рядок ($JsonString)
        $response = Invoke-RestMethod -Uri $Url -Method Post -Body $JsonString -ContentType "application/json" -Headers $Headers -TimeoutSec 10
        return $response
    } catch {
        # Обробка помилки з деталями
        $statusCode = $_.Exception.Response.StatusCode.value__ 
        $errorMessage = $_.Exception.Response.GetResponseStream() 
        $reader = New-Object System.IO.StreamReader($errorMessage)
        $responseBody = $reader.ReadToEnd()

        Write-Host "[ERROR] POST $Url failed."
        Write-Host "  -> Status Code: $statusCode"
        Write-Host "  -> Server Response: $responseBody"
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

# =====================================================
# 1. ADMIN LOGIN (Get Admin Token)
# =====================================================
Write-Host "---"
Write-Host "[STEP 1] Logging in as Admin: $($AdminUser.username)"
$loginResp = Invoke-PostJson "$ApiBase/auth/login" $AdminUser
if ($loginResp -ne $null -and $loginResp.token) {
    Write-Host "[SUCCESS] Admin Token received."
    $AdminToken = $loginResp.token
    $AdminHeaders = @{ Authorization = "Bearer $AdminToken" }
} else {
    Write-Host "[FATAL ERROR] Admin Login failed, cannot continue."
    exit 1
}

# =====================================================
# 2. ADMIN: CREATE PRODUCTS (Using Admin Token)
# =====================================================
Write-Host "---"
Write-Host "[STEP 2] Admin: Creating products..."
$createdProductsCount = 0
foreach ($prod in $Products) {
    $result = Invoke-PostJson "$ApiBase/admin/products" $prod $AdminHeaders 
    if ($result -ne $null -and $result.id) {
        Write-Host "[SUCCESS] Created product: $($prod.name) (ID: $($result.id))"
        $createdProductsCount++
    } else {
        Write-Host "[WARNING] Failed to create product: $($prod.name) (Maybe already exists)"
    }
    Start-Sleep -Milliseconds 200 
}
if ($createdProductsCount -eq 0) {
    Write-Host "[WARNING] No new products were created. Continuing test, assuming products exist."
}

# =====================================================
# 3. REGISTER NEW USER
# =====================================================
Write-Host "---"
Write-Host "[STEP 3] Registering New User: $($NewUser.username)"
$response = Invoke-PostJson "$ApiBase/auth/register" $NewUser
if ($response -ne $null -or $response.message -like "*already exists*") {
    Write-Host "[SUCCESS] User registered (or already exists)."
} else {
    Write-Host "[ERROR] Failed to register new user."
}

# =====================================================
# 4. USER LOGIN (Get User Token)
# =====================================================
Write-Host "---"
Write-Host "[STEP 4] Logging in as New User: $($NewUser.username)"
$loginResp = Invoke-PostJson "$ApiBase/auth/login" $NewUser
if ($loginResp -ne $null -and $loginResp.token) {
    Write-Host "[SUCCESS] User Token received."
    $UserToken = $loginResp.token
    $UserHeaders = @{ Authorization = "Bearer $UserToken" }
} else {
    Write-Host "[FATAL ERROR] User Login failed, cannot continue."
    exit 1
}

# =====================================================
# 5. GET PRODUCT LIST (Public, Unprotected)
# =====================================================
Write-Host "---"
Write-Host "[STEP 5] Getting Public Product Menu..."
$products = Invoke-GetJson "$ApiBase/products"
if ($products -ne $null -and $products.Count -gt 0) {
    Write-Host "[SUCCESS] Retrieved $($products.Count) active products."
    # Take the ID of the first product to use in the order
    $ProductId = [int]$products[0].id
    Write-Host "[INFO] Using Product ID: $ProductId for the order."
} else {
    Write-Host "[FATAL ERROR] Cannot get products. Ensure Admin created products first (Step 2)."
    exit 1
}
Write-Host "[CHECK] Current Product ID value before order: '$ProductId'"

# GET http://localhost:9001/api/products/1
$CheckUrl = "$ApiBase/products/$ProductId" 
$CheckResp = Invoke-RestMethod -Uri $CheckUrl -Method Get

if ($CheckResp) {
    Write-Host "[CHECK] Product ID '$ProductId' found. Name: $($CheckResp.name), Price: $($CheckResp.price)"
} else {
    Write-Host "[CHECK FAILED] Product ID '$ProductId' not found or inactive (expected 404/empty)."
}

# ----------------------------------------------------
# 6. CREATE ORDER (Protected by User Token) - ФІНАЛЬНЕ ВИПРАВЛЕННЯ JSON
# ----------------------------------------------------
Write-Host "---"
Write-Host "[STEP 6] Creating New Order with User Token..."

$NumericProductId = [int]$ProductId
$NumericQuantity = 2

$InnerJsonString = @{ 
    productId = $NumericProductId;
    quantity = $NumericQuantity;
} | ConvertTo-Json -Depth 5 -Compress

$OrderPayloadJsonString = "[$InnerJsonString]"

Write-Host "[DEBUG] FINAL PAYLOAD JSON STRING: $OrderPayloadJsonString" 

$orderResp = Invoke-PostJsonRaw "$ApiBase/orders" $OrderPayloadJsonString $UserHeaders
if ($orderResp -ne $null -and $orderResp.orderId) {
    Write-Host "[SUCCESS] Order created successfully."
    $NewOrderId = $orderResp.orderId
    Write-Host "[INFO] New Order ID: $NewOrderId"
} else {
    Write-Host "[FATAL ERROR] Failed to create order. Check Server logs for Zod output."
     exit 1
}

# =====================================================
# 7. ADMIN: GET ALL ORDERS (Protected by Admin Token)
# =====================================================
Write-Host "---"
Write-Host "[STEP 7] Admin: Getting all orders list..."
$allOrders = Invoke-GetJson "$ApiBase/admin/orders" $AdminHeaders

if ($allOrders -ne $null -and $allOrders.orders.Count -gt 0) {
    Write-Host "[SUCCESS] Admin retrieved $($allOrders.orders.Count) total orders."
    $newOrderCheck = $allOrders.orders | Where-Object {$_.orderId -eq $NewOrderId}
    if ($newOrderCheck) {
        Write-Host "[INFO] New order (ID $($newOrderCheck.orderId) found in the list. Current Status: $($newOrderCheck.status)"
    }
} else {
    Write-Host "[ERROR] Admin failed to retrieve any orders. Response structure: $($allOrders | ConvertTo-Json -Compress)"
}

# =====================================================
# 8. ADMIN: CHANGE ORDER STATUS (Protected by Admin Token)
# =====================================================
if ($NewOrderId -ne $null) {
    Write-Host "---"
    Write-Host "[STEP 8] Admin: Updating Order ID $NewOrderId status to 'DELIVERED'..."

    $StatusPayload = @{ status = "DELIVERED" } 
    $statusUrl = "$ApiBase/admin/orders/$NewOrderId/status"
    
    $statusResp = Invoke-PutJson $statusUrl $StatusPayload $AdminHeaders 
    
    if ($statusResp -ne $null -and $statusResp.message -like "*status updated*") {
        Write-Host "[SUCCESS] Order $NewOrderId status updated to DELIVERED. (Server Message: $($statusResp.message))"
    } else {
        Write-Host "[ERROR] Failed to update order status. See details above."
    }
}

# -------------------------
# 9. Admin: GET /admin/users
# -------------------------
Write-Host "---"
Write-Host "[STEP 9] Admin: fetch users list (GET /api/admin/users)..."

$users = Invoke-GetJson "$ApiBase/admin/users" $AdminHeaders

if ($users -ne $null) {
    if ($users.data -ne $null) {
        $list = $users.data
    } else {
        $list = $users
    }

    try {
        $uCount = ($list | Measure-Object).Count
    } catch {
        $uCount = 0
    }

    Write-Host "[INFO] Number of users returned to admin: $uCount"

    $foundAdmin = $list | Where-Object { $_.username -eq $AdminUser.username }
    $foundCustomer = $list | Where-Object { $_.username -eq $NewUser.username }

    if ($foundAdmin) { Write-Host "[CHECK] Admin user found." } else { Write-Host "[WARN] Admin user not found in list!" }
    if ($foundCustomer) { Write-Host "[CHECK] Customer user found." } else { Write-Host "[WARN] Customer user not found in list." }
} else {
    Write-Host "[FATAL] GET /api/admin/users failed."
    exit 1
}


Write-Host "---"
Write-Host "[SUCCESS] Test complete!"