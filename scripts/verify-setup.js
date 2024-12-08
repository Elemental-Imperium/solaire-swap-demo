const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const verifySetup = async () => {
    console.log('Verifying project setup...');

    // Check system dependencies
    const checkSystemDeps = () => {
        try {
            execSync('gcc --version', { stdio: 'ignore' });
            execSync('python3 --version', { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    };

    // Check node_modules
    const checkNodeModules = () => {
        return fs.existsSync(path.join(process.cwd(), 'node_modules'));
    };

    // Check contract compilation
    const checkCompilation = () => {
        try {
            execSync('yarn hardhat compile', { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    };

    // Run checks
    const checks = {
        'System Dependencies': checkSystemDeps(),
        'Node Modules': checkNodeModules(),
        'Contract Compilation': checkCompilation()
    };

    // Report results
    console.log('\nVerification Results:');
    Object.entries(checks).forEach(([check, passed]) => {
        console.log(`${check}: ${passed ? '✅' : '❌'}`);
    });

    // Return overall status
    return Object.values(checks).every(Boolean);
};

verifySetup()
    .then(success => {
        if (!success) {
            console.log('\nSome checks failed. Run ./scripts/resolve-dependencies.js to fix issues.');
            process.exit(1);
        }
        console.log('\nAll checks passed! ✨');
    })
    .catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    }); 