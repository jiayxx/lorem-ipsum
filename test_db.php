<?php
echo "<h1>Database Connection Test</h1>";

// Test basic connection
echo "<h2>Testing Database Connection...</h2>";
try {
    $conn = new mysqli("localhost", "root", "");
    if ($conn->connect_error) {
        echo "<p style='color: red;'>❌ Connection failed: " . $conn->connect_error . "</p>";
        exit;
    }
    echo "<p style='color: green;'>✅ Connected to MySQL successfully!</p>";
    
    // Test database creation/selection
    echo "<h2>Testing Database...</h2>";
    $dbname = "dtlearningsystem";
    
    $result = $conn->query("SHOW DATABASES LIKE '$dbname'");
    if ($result->num_rows == 0) {
        echo "<p>Database '$dbname' doesn't exist, creating...</p>";
        if ($conn->query("CREATE DATABASE $dbname")) {
            echo "<p style='color: green;'>✅ Database '$dbname' created successfully!</p>";
        } else {
            echo "<p style='color: red;'>❌ Error creating database: " . $conn->error . "</p>";
            exit;
        }
    } else {
        echo "<p style='color: green;'>✅ Database '$dbname' exists!</p>";
    }
    
    // Select the database
    $conn->select_db($dbname);
    echo "<p style='color: green;'>✅ Selected database '$dbname'!</p>";
    
    // Test tables
    echo "<h2>Testing Tables...</h2>";
    $tables = ['stages', 'methods', 'method_sections', 'method_stage'];
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows == 0) {
            echo "<p>Table '$table' doesn't exist, creating...</p>";
            createTable($conn, $table);
        } else {
            echo "<p style='color: green;'>✅ Table '$table' exists!</p>";
        }
    }
    
    // Check if stages have data
    $result = $conn->query("SELECT COUNT(*) as count FROM stages");
    $row = $result->fetch_assoc();
    if ($row['count'] == 0) {
        echo "<p>No stages found, inserting default stages...</p>";
        insertDefaultStages($conn);
    } else {
        echo "<p style='color: green;'>✅ Found " . $row['count'] . " stages!</p>";
    }
    
    // Show stages
    echo "<h2>Current Stages:</h2>";
    $result = $conn->query("SELECT * FROM stages ORDER BY stage_id");
    if ($result) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Description</th><th>Color</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['stage_id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['name']) . "</td>";
            echo "<td>" . htmlspecialchars($row['description']) . "</td>";
            echo "<td style='background-color: " . $row['color_code'] . "; color: white; padding: 5px;'>" . $row['color_code'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
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
        echo "<p style='color: green;'>✅ Table '$tableName' created successfully!</p>";
    } else {
        echo "<p style='color: red;'>❌ Error creating table '$tableName': " . $conn->error . "</p>";
    }
}

function insertDefaultStages($conn) {
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
        if ($conn->query($sql)) {
            echo "<p style='color: green;'>✅ Inserted stage: $name</p>";
        } else {
            echo "<p style='color: red;'>❌ Error inserting stage '$name': " . $conn->error . "</p>";
        }
    }
}

echo "<hr>";
echo "<p><a href='admin.html'>Go to Admin Panel</a></p>";
?>
