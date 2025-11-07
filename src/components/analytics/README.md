# Analytics Implementation Guide

Este projeto usa Google Analytics 4 para tracking de eventos e comportamento do usuário.

## Configuração

1. **Substitua o Measurement ID** em `index.html`:
   - Troque `G-XXXXXXXXXX` pelo seu GA4 Measurement ID real
   - Encontre seu ID em: Google Analytics > Admin > Data Streams

2. **Verifique se o tracking está funcionando**:
   - Abra o Google Analytics Realtime
   - Navegue pela aplicação
   - Veja os eventos aparecendo em tempo real

## Eventos Trackados

### 📊 Wizard & Onboarding
- `wizard_step_completed`: Usuário completou uma etapa do wizard
- `wizard_completed`: Usuário finalizou todo o wizard
- `wizard_abandoned`: Usuário abandonou o wizard

### 🤖 AI Usage
- `ai_usage`: Uso de qualquer feature de IA (SWOT, OGSM, OKRs, etc.)
- `ai_error`: Erro ao usar features de IA

### ⭐ Features
- `feature_used`: Uso de features específicas (ICE, BSC, 4DX, etc.)
- `export_used`: Exportação de dados (PDF, Excel, PPT)

### 💰 Conversion
- `sign_up`: Novo cadastro
- `login`: Login realizado
- `plan_created`: Plano estratégico criado
- `upgrade_initiated`: Início do processo de upgrade
- `purchase`: Compra completada (upgrade para plano pago)

### 📈 Engagement
- `objective_created`: Novo objetivo criado
- `initiative_created`: Nova iniciativa criada
- `metric_updated`: Métrica atualizada
- `checkin_completed`: Check-in semanal completado

## Como Usar

### Hook useAnalytics

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const MyComponent = () => {
  const { trackFeatureUsed, trackAIUsage } = useAnalytics();

  const handleExport = () => {
    // Seu código de export...
    trackExportUsed('pdf', 'strategic-plan');
  };

  const handleAIGeneration = async () => {
    const startTime = Date.now();
    try {
      await generateWithAI();
      const responseTime = Date.now() - startTime;
      trackAIUsage('ogsm-generation', true, responseTime);
    } catch (error) {
      trackAIError('ogsm-generation', error.message);
    }
  };

  return (
    <Button onClick={handleExport}>Export PDF</Button>
  );
};
```

### Componentes Helper

```typescript
import { WizardStepTracker, AIUsageTracker } from '@/components/analytics/EventTrackers';

// Tracking automático de etapa do wizard
<WizardStepTracker 
  stepNumber={1} 
  stepName="Contexto Empresarial" 
/>

// Tracking automático de uso de IA
<AIUsageTracker 
  feature="pestel-analysis"
  isLoading={isGenerating}
  error={error}
/>
```

## Métricas no Admin Dashboard

O dashboard administrativo (`/admin`) mostra:
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- Planos criados por dia
- Taxa de ativação
- Taxa de conversão
- MRR/ARR
- Distribuição por segmento

## Privacy & GDPR

- Não coletamos dados pessoais identificáveis nos eventos
- Use anonymizeIp se necessário
- Adicione um Cookie Consent banner se operar na EU

## Debugging

Para ver eventos no console durante desenvolvimento:

```javascript
// Em useAnalytics.ts, quando window.gtag não existe:
console.log('Analytics event:', eventName, params);
```