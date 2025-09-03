<?php
$servername = "localhost";
$username = "root";   // default in XAMPP
$password = "";       // default is empty in XAMPP
$dbname = "dtlearningsystem"; // your database name

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if database exists, if not create it
$result = $conn->query("SHOW DATABASES LIKE '$dbname'");
if ($result->num_rows == 0) {
    // Database doesn't exist, create it
    if ($conn->query("CREATE DATABASE $dbname")) {
        echo "Database '$dbname' created successfully\n";
    } else {
        die("Error creating database: " . $conn->error);
    }
}

// Select the database
$conn->select_db($dbname);

// Check if tables exist, if not create them
$tables = ['stages', 'methods', 'method_sections', 'method_stage'];
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows == 0) {
        createTable($conn, $table);
    }
}

function createTable($conn, $tableName) {
    switch ($tableName) {
        case 'stages':
            $sql = "CREATE TABLE stages (
                stage_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                color_code VARCHAR(7),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            break;
            
        case 'methods':
            $sql = "CREATE TABLE methods (
                method_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                short_desc TEXT,
                long_desc TEXT,
                resources TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            break;
            
        case 'method_sections':
            $sql = "CREATE TABLE method_sections (
                section_id INT AUTO_INCREMENT PRIMARY KEY,
                method_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                parent_section_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (method_id) REFERENCES methods(method_id) ON DELETE CASCADE,
                FOREIGN KEY (parent_section_id) REFERENCES method_sections(section_id) ON DELETE SET NULL
            )";
            break;
            
        case 'method_stage':
            $sql = "CREATE TABLE method_stage (
                method_id INT NOT NULL,
                stage_id INT NOT NULL,
                PRIMARY KEY (method_id, stage_id),
                FOREIGN KEY (method_id) REFERENCES methods(method_id) ON DELETE CASCADE,
                FOREIGN KEY (stage_id) REFERENCES stages(stage_id) ON DELETE CASCADE
            )";
            break;
    }
    
    if ($conn->query($sql)) {
        echo "Table '$tableName' created successfully\n";
    } else {
        echo "Error creating table '$tableName': " . $conn->error . "\n";
    }
}

// Insert default stages if they don't exist
$result = $conn->query("SELECT COUNT(*) as count FROM stages");
$row = $result->fetch_assoc();
if ($row['count'] == 0) {
    $defaultStages = [
        ['name' => 'EMPATHIZE', 'description' => 'Understanding the user and their needs', 'color_code' => '#06b6d4'],
        ['name' => 'DEFINE', 'description' => 'Defining the problem to be solved', 'color_code' => '#10b981'],
        ['name' => 'IDEATE', 'description' => 'Generating creative solutions', 'color_code' => '#f59e0b'],
        ['name' => 'PROTOTYPE', 'description' => 'Creating tangible representations', 'color_code' => '#ef4444'],
        ['name' => 'TEST', 'description' => 'Testing solutions with users', 'color_code' => '#7f1d1d']
    ];
    
    foreach ($defaultStages as $stage) {
        $name = $conn->real_escape_string($stage['name']);
        $desc = $conn->real_escape_string($stage['description']);
        $color = $conn->real_escape_string($stage['color_code']);
        $sql = "INSERT INTO stages (name, description, color_code) VALUES ('$name', '$desc', '$color')";
        $conn->query($sql);
    }
    echo "Default stages inserted successfully\n";
}
?>