# ✅ Checklist Rápido - Fase 4

## 🔗 Acesso
Navegue para: `/plan-validator`

## 📋 Validação Rápida por Conta

### 1️⃣ wagsansevero@gmail.com (ENTERPRISE)
```
Login → /plan-validator → Verificar:
✅ Tier = enterprise
✅ Limites todos em ∞ (999999)
✅ PDF mode = premium
✅ Todas features ✓ (verdes)
```

**Teste manual:**
- [ ] Criar 2+ empresas (deve funcionar)
- [ ] Exportar PDF (sem marca d'água)
- [ ] ICE Score funciona
- [ ] 5W2H funciona

---

### 2️⃣ legaltest@openai.com (PRO)
```
Login → /plan-validator → Verificar:
✅ Tier = pro
✅ max_companies = 1
✅ max_plans = 3
✅ max_objectives = ∞
✅ max_team_members = 3
✅ PDF mode = standard
✅ ice_score, five_w2h, four_dx_wbr = ✓
❌ custom_templates, integrations, branding = ✗
```

**Teste manual:**
- [ ] Tentar criar 2ª empresa → Modal de upgrade
- [ ] Criar 4º plano OGSM → Modal de upgrade
- [ ] Exportar PDF (sem marca d'água)
- [ ] ICE Score funciona
- [ ] 5W2H funciona
- [ ] Templates customizados bloqueados

---

### 3️⃣ legaloperadora@gmail.com (FREE)
```
⚠️ Primeiro: Criar empresa via wizard
Depois: /plan-validator → Verificar:
✅ Tier = free
✅ max_companies = 1
✅ max_plans = 1
✅ max_objectives = 3
✅ max_initiatives = 5
✅ max_team_members = 1
✅ PDF mode = watermark
❌ Todas features = ✗
```

**Teste manual:**
- [ ] Criar 4º objetivo → Modal de upgrade
- [ ] Criar 6ª iniciativa → Modal de upgrade
- [ ] Tentar convidar membro → Modal de upgrade
- [ ] Exportar PDF (COM marca d'água visível)
- [ ] ICE Score bloqueado
- [ ] 5W2H bloqueado
- [ ] 4DX/WBR bloqueado

---

## 🎯 Teste dos Limites (Crítico)

### FREE - legaloperadora@gmail.com
1. Criar exatamente 3 objetivos ✓
2. Tentar criar 4º → Ver modal ⚠️
3. Criar 5 iniciativas em um objetivo ✓
4. Tentar criar 6ª → Ver modal ⚠️
5. Exportar PDF → Marca d'água presente 💧

### PRO - legaltest@openai.com
1. Criar 3 planos OGSM ✓
2. Tentar criar 4º → Ver modal ⚠️
3. Convidar 3 membros ✓
4. Tentar convidar 4º → Ver modal ⚠️
5. Exportar PDF → SEM marca d'água ✓

### ENTERPRISE - wagsansevero@gmail.com
1. Criar múltiplas empresas ✓
2. Criar múltiplos planos ✓
3. Nunca ver modais de limite 🚫
4. Exportar PDF premium ✓

---

## 🐛 O que Verificar

### Validações Automáticas (no /plan-validator)
- [ ] "Plano correto" = ✓ verde
- [ ] "Possui empresa" = ✓ verde
- [ ] Limites mostram números corretos
- [ ] Features mostram ✓ ou ✗ corretos

### Modais de Upgrade
- [ ] Aparecem ao atingir limites
- [ ] Mensagem específica por tipo
- [ ] Botão "Fazer Upgrade" funciona

### PDF Export
- [ ] FREE: marca d'água visível
- [ ] PRO: sem marca d'água
- [ ] ENTERPRISE: sem marca d'água + toast "premium"

### Features Bloqueadas
- [ ] ICE Score bloqueado no FREE
- [ ] 5W2H bloqueado no FREE
- [ ] 4DX/WBR bloqueado no FREE
- [ ] Templates customizados bloqueados no PRO
- [ ] Integrações bloqueadas no PRO e FREE

---

## 🚨 Problemas para Reportar

Se encontrar:
- ❌ Limite não bloqueando quando deveria
- ❌ Feature disponível quando deveria estar bloqueada
- ❌ Modal não aparecendo
- ❌ Números errados no validador
- ❌ PDF sem/com marca d'água incorreta

Anotar aqui e reportar.

---

## ✨ Status Final

- [ ] Todas 3 contas validadas
- [ ] Limites funcionando
- [ ] Features corretas por plano
- [ ] Modais de upgrade aparecem
- [ ] PDF com/sem marca d'água correto

✅ FASE 4 COMPLETA quando todos os itens marcados!
