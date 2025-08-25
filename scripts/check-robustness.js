#!/usr/bin/env node

/**
 * 项目鲁棒性检查脚本
 * 用于检查代码质量、类型安全、错误处理等方面
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 颜色输出工具
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
}

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`),
}

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0
let warnings = 0

function runCheck(name, command, description) {
  totalChecks++
  log.title(`检查 ${totalChecks}: ${name}`)
  log.info(description)
  
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    
    // 特殊处理lint输出
    if (command.includes('lint')) {
      if (output.trim() === '' || output.includes('✓ No ESLint warnings or errors') || output.includes('✔ No ESLint warnings or errors')) {
        log.success(`${name} - 通过`)
        passedChecks++
        return true
      } else {
        // 检查是否只有警告
        const hasErrors = output.includes('Error:')
        if (hasErrors) {
          log.error(`${name} - 失败`)
          console.log(output)
          failedChecks++
          return false
        } else {
          log.warning(`${name} - 有警告`)
          console.log(output)
          warnings++
          return true
        }
      }
    }
    
    log.success(`${name} - 通过`)
    passedChecks++
    return true
  } catch (error) {
    log.error(`${name} - 失败`)
    console.log(error.stdout || error.message)
    failedChecks++
    return false
  }
}

function checkFileExists(filePath, description) {
  totalChecks++
  const name = `文件存在性检查: ${path.basename(filePath)}`
  log.title(`检查 ${totalChecks}: ${name}`)
  log.info(description)
  
  if (fs.existsSync(filePath)) {
    log.success(`${name} - 通过`)
    passedChecks++
    return true
  } else {
    log.error(`${name} - 失败: 文件不存在`)
    failedChecks++
    return false
  }
}

function checkProjectStructure() {
  log.title('🏗️  项目结构检查')
  
  const requiredFiles = [
    { path: 'package.json', desc: '项目配置文件' },
    { path: 'tsconfig.json', desc: 'TypeScript配置文件' },
    { path: 'next.config.mjs', desc: 'Next.js配置文件' },
    { path: 'tailwind.config.js', desc: 'Tailwind CSS配置文件' },
    { path: '.env.example', desc: '环境变量示例文件' },
  ]
  
  const requiredDirs = [
    { path: 'app', desc: 'Next.js App目录' },
    { path: 'components', desc: '组件目录' },
    { path: 'lib', desc: '工具库目录' },
    { path: 'types', desc: '类型定义目录' },
  ]
  
  requiredFiles.forEach(file => {
    checkFileExists(file.path, file.desc)
  })
  
  requiredDirs.forEach(dir => {
    checkFileExists(dir.path, dir.desc)
  })
}

function checkCodeQuality() {
  log.title('📝 代码质量检查')
  
  // TypeScript类型检查
  runCheck(
    'TypeScript类型检查',
    'npx tsc --noEmit',
    '检查TypeScript类型安全'
  )
  
  // ESLint代码规范检查
  runCheck(
    'ESLint代码规范',
    'npm run lint',
    '检查代码规范和潜在问题'
  )
  
  // 依赖安全检查 - 检查package.json中的包管理器
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const hasPnpmLock = fs.existsSync('pnpm-lock.yaml')
  const hasNpmLock = fs.existsSync('package-lock.json')
  
  if (hasPnpmLock) {
    runCheck(
      '依赖安全检查',
      'pnpm audit --audit-level high',
      '检查依赖包安全漏洞（使用pnpm）'
    )
  } else if (hasNpmLock) {
    runCheck(
      '依赖安全检查',
      'npm audit --audit-level high',
      '检查依赖包安全漏洞（使用npm）'
    )
  } else {
    totalChecks++
    const name = '依赖安全检查'
    log.title(`检查 ${totalChecks}: ${name}`)
    log.warning(`${name} - 跳过：未找到锁定文件 (package-lock.json 或 pnpm-lock.yaml)`)
    warnings++
  }
}

function checkErrorHandling() {
  log.title('🚨 错误处理检查')
  
  const errorHandlerFiles = [
    'lib/error-handler.ts',
    'components/error-boundary.tsx',
    'lib/validation.ts'
  ]
  
  errorHandlerFiles.forEach(file => {
    checkFileExists(file, `错误处理模块: ${file}`)
  })
  
  // 检查主要文件中是否有try-catch
  const mainFiles = [
    'app/page.tsx',
    'lib/services/pdf-processor.ts',
    'lib/services/ocr-processor.ts',
    'lib/services/ai-processor.ts'
  ]
  
  mainFiles.forEach(file => {
    totalChecks++
    const name = `错误处理检查: ${path.basename(file)}`
    log.title(`检查 ${totalChecks}: ${name}`)
    
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      const hasTryCatch = content.includes('try') && content.includes('catch')
      const hasErrorHandling = content.includes('handleError') || content.includes('ErrorType')
      
      if (hasTryCatch || hasErrorHandling) {
        log.success(`${name} - 通过`)
        passedChecks++
      } else {
        log.warning(`${name} - 缺少错误处理`)
        warnings++
      }
    } else {
      log.error(`${name} - 文件不存在`)
      failedChecks++
    }
  })
}

function checkPerformance() {
  log.title('⚡ 性能优化检查')
  
  // 检查动态导入
  const performanceFiles = [
    { file: 'lib/services/pdf-processor.ts', pattern: 'import(' }
  ]
  
  performanceFiles.forEach(({ file, pattern }) => {
    totalChecks++
    const name = `动态导入检查: ${path.basename(file)}`
    log.title(`检查 ${totalChecks}: ${name}`)
    
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes(pattern)) {
        log.success(`${name} - 通过`)
        passedChecks++
      } else {
        log.warning(`${name} - 未发现动态导入优化`)
        warnings++
      }
    } else {
      log.error(`${name} - 文件不存在`)
      failedChecks++
    }
  })
  
  // 检查图片优化
  checkFileExists('components/pdf-converter/OptimizedImageDisplay.tsx', '图片优化组件')
  checkFileExists('lib/utils/image-seo-utils.ts', '图片SEO优化工具')
}

function checkSEO() {
  log.title('🔍 SEO优化检查')
  
  const seoFiles = [
    'components/enhanced-seo-schema.tsx',
    'lib/utils/image-seo-utils.ts'
  ]
  
  seoFiles.forEach(file => {
    checkFileExists(file, `SEO优化模块: ${path.basename(file)}`)
  })
  
  // 检查结构化数据
  totalChecks++
  const name = '结构化数据检查'
  log.title(`检查 ${totalChecks}: ${name}`)
  
  const pageFile = 'app/page.tsx'
  if (fs.existsSync(pageFile)) {
    const content = fs.readFileSync(pageFile, 'utf8')
    const hasEnhancedSchema = content.includes('EnhancedSEOSchema')
    
    if (hasEnhancedSchema) {
      log.success(`${name} - 通过`)
      passedChecks++
    } else {
      log.warning(`${name} - 缺少增强SEO Schema`)
      warnings++
    }
  } else {
    log.error(`${name} - 主页面文件不存在`)
    failedChecks++
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(50))
  log.title('📊 项目鲁棒性检查报告')
  console.log('='.repeat(50))
  
  console.log(`总检查项: ${totalChecks}`)
  log.success(`通过: ${passedChecks}`)
  log.warning(`警告: ${warnings}`)
  log.error(`失败: ${failedChecks}`)
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1)
  console.log(`\n成功率: ${successRate}%`)
  
  if (failedChecks === 0 && warnings === 0) {
    log.success('🎉 项目鲁棒性检查全部通过！')
  } else if (failedChecks === 0) {
    log.warning('⚠️  项目基本健康，但有一些警告需要关注')
  } else {
    log.error('❌ 项目存在严重问题，需要立即修复')
  }
  
  console.log('\n💡 建议:')
  console.log('- 定期运行此检查脚本')
  console.log('- 在提交代码前确保所有检查通过')
  console.log('- 优先修复错误，然后处理警告')
  console.log('- 保持依赖更新和安全')
  
  return failedChecks === 0
}

// 主执行函数
function main() {
  console.log(`${colors.cyan}🔍 PDF转图片项目 - 鲁棒性检查工具${colors.reset}`)
  console.log(`${colors.gray}检查项目代码质量、类型安全、错误处理等${colors.reset}\n`)
  
  try {
    checkProjectStructure()
    checkCodeQuality()
    checkErrorHandling()
    checkPerformance()
    checkSEO()
    
    const success = generateReport()
    process.exit(success ? 0 : 1)
  } catch (error) {
    log.error(`检查过程中发生错误: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  runCheck,
  checkFileExists,
  checkProjectStructure,
  checkCodeQuality,
  checkErrorHandling,
  checkPerformance,
  checkSEO,
  generateReport
}