# Guía de Desinstalación

Esta guía proporciona instrucciones para limpiar completamente Node.js, npm y las dependencias del proyecto en diferentes sistemas operativos.

## macOS

### 1. Limpiar el Proyecto
```bash
# Eliminar carpeta node_modules y archivos de configuración
rm -rf node_modules
rm -rf dist
rm package-lock.json
rm -rf .npm
rm -rf .cache/node
```

### 2. Desinstalar Node.js y npm usando Homebrew
```bash
# Desenlazar todas las versiones de Node
brew unlink node
brew unlink node@18

# Desinstalar Node.js
brew uninstall node
brew uninstall node@18

# Limpiar caché de Homebrew
brew cleanup

# Verificar que Node.js y npm fueron eliminados
node --version # Debería mostrar "command not found"
npm --version  # Debería mostrar "command not found"
```

### 3. Eliminar Archivos Residuales
```bash
# Eliminar directorios de configuración global
rm -rf ~/.node
rm -rf ~/.npm
rm -rf ~/.nvm
rm -rf ~/.node-gyp
rm -rf ~/.node_repl_history

# Eliminar caché
rm -rf ~/Library/Caches/node-gyp/
rm -rf ~/Library/Caches/Homebrew/downloads/
```

## Windows

### 1. Limpiar el Proyecto
```powershell
# Eliminar carpeta node_modules y archivos de configuración
rmdir /s /q node_modules
rmdir /s /q dist
del package-lock.json
```

### 2. Desinstalar Node.js y npm
1. Abrir "Panel de Control"
2. Ir a "Programas y características" o "Agregar o quitar programas"
3. Encontrar "Node.js" en la lista
4. Click derecho y seleccionar "Desinstalar"
5. Seguir las instrucciones del desinstalador

### 3. Eliminar Archivos Residuales (PowerShell como Administrador)
```powershell
# Eliminar directorios de Node.js
Remove-Item -Recurse -Force "$env:ProgramFiles\nodejs"
Remove-Item -Recurse -Force "$env:ProgramFiles(x86)\nodejs"

# Eliminar directorios de npm
Remove-Item -Recurse -Force "$env:APPDATA\npm"
Remove-Item -Recurse -Force "$env:APPDATA\npm-cache"

# Eliminar variables de entorno
[System.Environment]::SetEnvironmentVariable("PATH", ([System.Environment]::GetEnvironmentVariable("PATH", "User")).Replace(";$env:APPDATA\npm", ""), "User")
```

## Verificación Final

### macOS
```bash
# Verificar que todo se eliminó correctamente
which node
which npm
```

### Windows (PowerShell)
```powershell
# Verificar que todo se eliminó correctamente
Get-Command node
Get-Command npm
```

Si estos comandos devuelven "not found" o errores similares, la desinstalación fue exitosa.

## Reinstalación (Si es necesario)

### macOS
```bash
# Instalar Node.js v18 usando Homebrew
brew install node@18
brew link node@18

# Verificar la instalación
node --version
npm --version
```

### Windows
1. Descargar el instalador de Node.js v18 LTS desde [nodejs.org](https://nodejs.org/)
2. Ejecutar el instalador
3. Seguir las instrucciones del asistente de instalación
4. Abrir una nueva ventana de PowerShell y verificar:
```powershell
node --version
npm --version
```
