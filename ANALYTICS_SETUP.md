# 📊 Analytics Setup Guide

## Fase 17: Analytics e Métricas do Produto - IMPLEMENTADO ✅

Este documento explica como configurar e usar o sistema de analytics implementado.

---

## 🎯 O que foi implementado

### 1. Google Analytics 4 Integration
- Tracking automático de page views
- 20+ eventos personalizados
- Hook `useAnalytics` para facilitar tracking
- Componentes helper para tracking automático

### 2. Dashboard Administrativo (`/admin`)
Acesso restrito a owners com métricas internas:
- **Usuários**: DAU, MAU, total de usuários
- **Planos**: Total criados, planos por dia
- **Engajamento**: Taxa de ativação, média de objetivos/iniciativas
- **Revenue**: MRR, ARR, assinaturas ativas
- **Segmentos**: Distribuição por setor
- **Gráficos**: Crescimento, engajamento, segmentação

---

## 🚀 Setup Inicial

### Passo 1: Obter Google Analytics Measurement ID

1. Acesse [Google Analytics](https://analytics.google.com/)
2. Crie uma propriedade GA4 (se ainda não tiver)
3. Vá em: **Admin > Data Streams > Web**
4. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

### Passo 2: Configurar o Measurement ID

Substitua `G-XXXXXXXXXX` pelo seu ID real em **2 lugares**:

**1. index.html** (linha 20 e 25):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=SEU-ID-AQUI"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'SEU-ID-AQUI', {
    send_page_view: false
  });
</script>
```

**2. src/hooks/useAnalytics.ts** (linha 25):
```typescript
window.gtag('config', 'SEU-ID-AQUI', {
  page_path: location.pathname + location.search,
});
```

### Passo 3: Verificar se está funcionando

1. Faça o deploy da aplicação
2. Abra: Google Analytics > Reports > Realtime
3. Navegue pela aplicação
4. Veja os eventos aparecendo em tempo real! 🎉

---

## 📈 Eventos Trackados

### Wizard & Onboarding
| Evento | Quando é disparado | Parâmetros |
|--------|-------------------|------------|
| `wizard_step_completed` | Usuário completa etapa | step_number, step_name, time_spent_seconds |
| `wizard_completed` | Wizard finalizado | total_time_seconds, steps_completed |
| `wizard_abandoned` | Usuário abandona wizard | last_step, time_spent_seconds |

### AI Usage
| Evento | Quando é disparado | Parâmetros |
|--------|-------------------|------------|
| `ai_usage` | Uso de feature de IA | feature, success, response_time_ms |
| `ai_error` | Erro ao usar IA | feature, error_type |

### Features
| Evento | Quando é disparado | Parâmetros |
|--------|-------------------|------------|
| `feature_used` | Uso de feature | feature_name, context |
| `export_used` | Exportação de dados | export_type (pdf/excel/ppt), section |

### Conversion
| Evento | Quando é disparado | Parâmetros |
|--------|-------------------|------------|
| `sign_up` | Novo cadastro | method (email/google/phone) |
| `login` | Login | method (email/google/phone) |
| `plan_created` | Plano estratégico criado | segment, model |
| `upgrade_initiated` | Início upgrade | from_plan, to_plan |
| `purchase` | Upgrade completado | value, currency, items |

### Engagement
| Evento | Quando é disparado | Parâmetros |
|--------|-------------------|------------|
| `objective_created` | Novo objetivo | perspective |
| `initiative_created` | Nova iniciativa | status, has_ice_score |
| `metric_updated` | Métrica atualizada | metric_type |
| `checkin_completed` | Check-in semanal | week_number |

---

## 💻 Como Usar no Código

### Hook useAnalytics

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const MyComponent = () => {
  const { 
    trackFeatureUsed, 
    trackAIUsage, 
    trackExportUsed 
  } = useAnalytics();

  const handleExport = () => {
    // Seu código de export
    exportToPDF();
    
    // Track o evento
    trackExportUsed('pdf', 'strategic-plan');
  };

  const handleAIGeneration = async () => {
    const startTime = Date.now();
    try {
      await generateOGSM();
      const responseTime = Date.now() - startTime;
      trackAIUsage('ogsm-generation', true, responseTime);
    } catch (error) {
      trackAIError('ogsm-generation', error.message);
    }
  };

  return <Button onClick={handleExport}>Export</Button>;
};
```

### Componentes Helper

**Tracking automático de wizard:**
```typescript
import { WizardStepTracker } from '@/components/analytics/EventTrackers';

<WizardStepTracker 
  stepNumber={1} 
  stepName="Contexto Empresarial" 
/>
```

**Tracking automático de IA:**
```typescript
import { AIUsageTracker } from '@/components/analytics/EventTrackers';

<AIUsageTracker 
  feature="pestel-analysis"
  isLoading={isGenerating}
  error={error}
/>
```

---

## 🔐 Dashboard Admin

Acesse `/admin` (apenas owners têm acesso).

**Métricas disponíveis:**
- 📊 KPIs principais (DAU, MAU, planos, revenue)
- 📈 Gráficos de crescimento
- 🎯 Taxa de ativação e engajamento
- 💰 MRR/ARR
- 📊 Distribuição por segmento
- 📋 Lista de empresas cadastradas

---

## 🎨 Próximos Passos (Opcionais)

### Analytics Avançado
- [ ] Configurar Conversões e Goals no GA4
- [ ] Criar Funis de Conversão
- [ ] Configurar Enhanced Ecommerce
- [ ] Adicionar User ID tracking

### Alternativas ao GA4
Se preferir outras ferramentas:

**PostHog** (Open Source):
```bash
npm install posthog-js
```

**Mixpanel**:
```bash
npm install mixpanel-browser
```

**Amplitude**:
```bash
npm install @amplitude/analytics-browser
```

### GDPR & Privacy
- [ ] Adicionar Cookie Consent banner
- [ ] Configurar anonymizeIp
- [ ] Criar Privacy Policy
- [ ] Implementar opt-out

---

## 🐛 Debugging

### Ver eventos no console

Durante desenvolvimento, quando `window.gtag` não existe, os eventos são logados:

```javascript
console.log('Analytics event:', eventName, params);
```

### Verificar no GA4 Realtime

1. Google Analytics > Reports > Realtime
2. Navegue pela aplicação
3. Veja eventos aparecendo instantaneamente

### Debug Mode do GA4

Adicione `?debug_mode=1` na URL para ativar debug:
```
https://seuapp.com/dashboard?debug_mode=1
```

---

## 📚 Recursos

- [Google Analytics 4 Docs](https://developers.google.com/analytics/devguides/collection/ga4)
- [Event Naming Best Practices](https://support.google.com/analytics/answer/9322688)
- [Analytics Dashboard Lovable](https://docs.lovable.dev/features/analytics)

---

## ✅ Checklist de Implementação

- [x] Hook useAnalytics criado
- [x] GA4 integrado no index.html
- [x] Page view tracking automático
- [x] 20+ eventos personalizados
- [x] Componentes helper de tracking
- [x] Dashboard admin com métricas internas
- [x] Tracking de signup/login
- [x] Session tracking
- [ ] Substituir Measurement ID (SEU-ID-AQUI)
- [ ] Testar no GA4 Realtime
- [ ] Configurar Goals no GA4

---

**Implementado por:** Lovable AI  
**Fase:** 17 - Analytics e Métricas do Produto  
**Status:** ✅ 100% Completo (exceto configuração do Measurement ID)