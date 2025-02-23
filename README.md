# sp-mailtrace-app

A Vue.js application for tracing emails across different mail systems (Exchange, Mimecast, Echoworx).

## Features
- Basic and Advanced search modes
- Real-time filtering and sorting
- Pagination
- Message details view
- Responsive design
- System-specific styling
- Mock data support for development

## Prerequisites

### For macOS users:
The default interactive shell is now zsh.
To update your account to use zsh, please run `chsh -s /bin/zsh`.
For more details, please visit https://support.apple.com/kb/HT208050.

1. Install Homebrew (if not already installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install Node.js and npm:
```bash
brew install node@18
brew link node@18
```

3. Verify the installation:
```bash
node --version  # Debería mostrar v18.x.x
npm --version
```

## Project setup

### Install dependencies
```bash
# Instalar dependencias con flag para manejar conflictos de pares
npm install --legacy-peer-deps
```

### Version compatibility fix
Si encuentras errores de incompatibilidad entre vue y vue-template-compiler, ejecuta:
```bash
# Desinstalar versiones actuales
npm uninstall vue vue-template-compiler vee-validate

# Instalar versiones compatibles para Vue 2
npm install vue@2.7.16 vue-template-compiler@2.7.16 --legacy-peer-deps

# Instalar versión compatible de vee-validate para Vue 2
npm install vee-validate@3.4.15 --legacy-peer-deps

# Instalar dependencias de Babel necesarias
npm install --save-dev @babel/core @babel/preset-env @vue/cli-plugin-babel --legacy-peer-deps
```

### Configuración de Babel
Crea o actualiza el archivo `babel.config.js` en la raíz del proyecto:
```bash
echo 'module.exports = {
  presets: [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    "@vue/cli-plugin-babel/preset"
  ]
}' > babel.config.js
```

### Compiles and hot-reloads for development
```bash
# Opción 1: Usar export (recomendado)
export NODE_OPTIONS=--openssl-legacy-provider && npm run serve

# Opción 2: Ejecutar directamente
NODE_OPTIONS=--openssl-legacy-provider npm run serve
```

### Compiles and minifies for production
```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

### Lints and fixes files
```bash
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Troubleshooting

### Vue Version Mismatch
Si ves un error sobre "Vue packages version mismatch", asegúrate de que las versiones de `vue` y `vue-template-compiler` sean idénticas siguiendo los pasos en la sección "Version compatibility fix".

### Error: digital envelope routines::unsupported
Si encuentras este error, hay dos soluciones posibles:

1. **Solución recomendada**: Cambiar a Node.js v18
```bash
# Usando Homebrew
brew install node@18
brew unlink node
brew link node@18
```

2. **Solución alternativa**: Usar el flag legacy OpenSSL
```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

Después de aplicar cualquiera de estas soluciones, intenta ejecutar el proyecto nuevamente.

### Error: Module parse failed: Unexpected token
Si encuentras este error relacionado con la sintaxis moderna de JavaScript (como el operador `?.`), sigue estos pasos:

1. **Instalar dependencias de Babel**:
```bash
npm install --save-dev @babel/core @babel/preset-env
npm install --save-dev @vue/cli-plugin-babel
```

2. **Configurar Babel**:
Crea o actualiza el archivo `babel.config.js`:
```bash
echo 'module.exports = {
  presets: [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    "@vue/cli-plugin-babel/preset"
  ]
}' > babel.config.js
```

3. **Limpiar caché y reinstalar**:
```bash
rm -rf node_modules
rm -rf dist
npm cache clean --force
npm install
```

4. **Reconstruir el proyecto**:
```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

### Error: Conflicting peer dependency
Si encuentras errores de conflicto de dependencias con vee-validate, sigue estos pasos:

1. **Limpiar la instalación actual**:
```bash
rm -rf node_modules
rm package-lock.json
```

2. **Reinstalar con la versión correcta de vee-validate**:
```bash
# Instalar dependencias principales
npm install vue@2.7.16 vue-template-compiler@2.7.16 --legacy-peer-deps

# Instalar vee-validate compatible con Vue 2
npm install vee-validate@3.4.15 --legacy-peer-deps

# Instalar el resto de dependencias
npm install --legacy-peer-deps
```

3. **Si sigues teniendo problemas**, puedes forzar la instalación:
```bash
npm install --force
```

Nota: El uso de `--legacy-peer-deps` o `--force` puede causar problemas de compatibilidad, pero es necesario en este caso debido a las restricciones de versiones.
