export default {
    // Defines the directory where Jest should look for test files.
    // '<rootDir>/src' means Jest will start searching inside the 'src' folder.
    roots: ['<rootDir>/backend/src'], 
    
    // Pattern to find test files. It looks for files in '__tests__' folders
    // or files ending with '.test.js' or '.spec.js'.
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // We use 'babel-jest' to transform ES Modules (import/export syntax) 
    // into standard CommonJS format that Node.js and Jest can understand.
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    
    // File extensions Jest should handle.
    moduleFileExtensions: ['js', 'json', 'node'],

    // --- Coverage Settings ---

    // Enable code coverage reporting.
    collectCoverage: true,
    
    // Specifies which files to include in the coverage report.
    // We focus mainly on the business logic inside the 'services' folder.
    collectCoverageFrom: [
        'backend/src/services/**/*.js',
        // Exclude the database adapter as it mostly deals with I/O and setup
        '!backend/src/data/db_adapter.js', 
    ],

    // Force Jest to stop running tests after the first failure.
    bail: false,

    // The environment Jest will use. 'node' is standard for backend testing.
    testEnvironment: 'node',
};