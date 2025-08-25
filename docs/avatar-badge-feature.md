# 头像角标功能

## 功能概述

为头像组件添加了角标功能，用于区分不同订阅计划的用户：

- **Free**: 不显示角标
- **Basic**: 显示蓝色"Basic"角标
- **Pro**: 显示紫色"Pro"角标
- **Enterprise**: 显示金色"Enterprise"角标

## 实现详情

### 1. 新增 Hook：`useSubscription`

位置：`lib/hooks/use-subscription.tsx`

功能：
- 获取用户订阅状态
- 返回计划类型、显示名称和颜色配置
- 自动识别订阅计划类型

```typescript
const { planType, getPlanDisplayName, getPlanColor, loading } = useSubscription()
```

### 2. 扩展头像组件：`AvatarWithBadge`

位置：`components/ui/avatar.tsx`

新增组件：
- 支持在头像右上角显示角标
- 可自定义角标文字和颜色
- 可控制是否显示角标

```typescript
<AvatarWithBadge 
  showBadge={shouldShowBadge}
  badgeText="Pro"
  badgeColor="text-purple-600 bg-purple-100"
>
  <AvatarImage src={avatarUrl} />
  <AvatarFallback>{initials}</AvatarFallback>
</AvatarWithBadge>
```

### 3. 更新用户菜单组件

位置：`components/auth/user-menu.tsx`

变更：
- 使用新的 `AvatarWithBadge` 组件
- 集成订阅状态显示
- 在用户菜单中同时显示角标信息

## 角标样式配置

### 计划类型和颜色映射

```typescript
const getPlanColor = () => {
  switch (subscription.planType) {
    case 'basic':
      return 'text-blue-600 bg-blue-100'
    case 'pro':
      return 'text-purple-600 bg-purple-100'
    case 'enterprise':
      return 'text-amber-600 bg-amber-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}
```

### 角标样式特点

- 位置：头像右上角 (`-top-1 -right-1`)
- 大小：最小18px宽度，18px高度
- 字体：10px，粗体
- 边框：白色边框，适应深色模式
- 阴影：轻微阴影效果

## 使用场景

1. **导航栏用户头像**：显示用户订阅级别
2. **用户资料页面**：快速识别用户类型
3. **管理后台**：区分不同权限用户

## 技术要点

- 基于 Radix UI Avatar 组件扩展
- 响应式设计，支持不同尺寸
- TypeScript 完整类型支持
- 遵循项目设计系统规范
- 自动适应深色/浅色主题