const fs = require('fs')
const path = require('path')

// Fix ENOTDIR: remove node_modules if it exists as a file instead of directory
const nmPath = path.resolve(__dirname, 'node_modules')
try {
  const stat = fs.lstatSync(nmPath)
  if (!stat.isDirectory()) {
    fs.unlinkSync(nmPath)
  }
} catch (e) {
  // doesn't exist, that's fine
}

module.exports = {
  hooks: {
    readPackage(pkg) {
      return pkg
    }
  }
}
