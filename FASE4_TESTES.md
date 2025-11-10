# Fase 4 - Validação e Testes dos Planos

## Acesso ao Validador

Acesse: `/plan-validator` na aplicação

## Contas de Teste

### 1. wagsansevero@gmail.com - ENTERPRISE ✅
**Status:** Configurado  
**Empresa:** Humanoid Platforms LTDA  
**Plano:** Enterprise (ativo)

#### Testes Esperados:
- ✅ Criar múltiplas empresas (ilimitadas)
- ✅ Criar planos OGSM ilimitados
- ✅ Criar objetivos ilimitados
- ✅ Criar iniciativas ilimitadas por objetivo
- ✅ Convidar membros ilimitados
- ✅ ICE Score disponível
- ✅ 5W2H disponível
- ✅ 4DX/WBR disponível
- ✅ Exportar PDF premium (sem marca d'água)
- ✅ Templates básicos disponíveis
- ✅ Templates customizados disponíveis
- ✅ Integrações disponíveis
- ✅ Colaboração disponível
- ✅ Branding personalizado disponível
- ✅ Audit log disponível
- ✅ Permissões avançadas disponíveis

**Limites Esperados:**
- max_companies: 999999
- max_plans: 999999
- max_objectives: 999999
- max_initiatives_per_objective: 999999
- max_team_members: 999999
- pdf_export_mode: "premium"

### 2. legaltest@openai.com - PRO ✅
**Status:** Configurado  
**Empresa:** Empresa Teste  
**Plano:** Pro (ativo)

#### Testes Esperados:
- ✅ Criar 1 empresa
- ✅ Criar até 3 planos OGSM
- ✅ Criar objetivos ilimitados
- ✅ Criar iniciativas ilimitadas
- ✅ Convidar até 3 membros
- ✅ ICE Score disponível
- ✅ 5W2H disponível
- ✅ 4DX/WBR disponível
- ✅ Exportar PDF standard (sem marca d'água)
- ✅ Templates básicos disponíveis
- ✅ Colaboração disponível
- ❌ Templates customizados BLOQUEADOS
- ❌ Integrações BLOQUEADAS
- ❌ Branding BLOQUEADO
- ❌ Audit log BLOQUEADO
- ⚠️ Modal de upgrade aparece ao tentar criar 2ª empresa
- ⚠️ Modal de upgrade aparece ao criar 4º plano OGSM

**Limites Esperados:**
- max_companies: 1
- max_plans: 3
- max_objectives: 999999
- max_initiatives_per_objective: 999999
- max_team_members: 3
- pdf_export_mode: "standard"

### 3. legaloperadora@gmail.com - FREE ⚠️
**Status:** Aguardando criação de empresa  
**Empresa:** Ainda não criada  
**Plano:** FREE (será atribuído automaticamente)

#### Testes Esperados:
- ✅ Criar 1 empresa
- ✅ Criar 1 plano OGSM
- ✅ Criar até 3 objetivos
- ✅ Criar até 5 iniciativas por objetivo
- ✅ Apenas 1 membro (owner)
- ✅ Exportar PDF com marca d'água
- ❌ ICE Score BLOQUEADO
- ❌ 5W2H BLOQUEADO
- ❌ 4DX/WBR BLOQUEADO
- ❌ Templates BLOQUEADOS
- ❌ Colaboração BLOQUEADA
- ⚠️ Modal de upgrade ao atingir 3 objetivos
- ⚠️ Modal de upgrade ao tentar criar 2º plano OGSM
- ⚠️ Modal de upgrade ao tentar convidar membro
- ⚠️ Modal de upgrade ao tentar criar 6ª iniciativa

**Limites Esperados:**
- max_companies: 1
- max_plans: 1
- max_objectives: 3
- max_initiatives_per_objective: 5
- max_team_members: 1
- pdf_export_mode: "watermark"

## Roteiro de Testes

### Passo 1: Validações Automáticas
Para cada conta, verificar na página `/plan-validator`:

1. **Status da Conta**
   - Email correto
   - Empresa associada
   - Plano esperado = Plano atual

2. **Limites Configurados**
   - Verificar se os valores no banco estão corretos
   - Conferir uso atual vs. limite

3. **Features Habilitadas**
   - Verificar checkmarks verdes/vermelhos para cada feature
   - Conferir se batem com a tabela de comparação

### Passo 2: Testes de Limites (Manual)

#### Teste 2.1: Limite de Empresas
**FREE e PRO:**
1. Tentar criar uma 2ª empresa
2. Verificar se aparece modal de UpgradePrompt
3. Verificar mensagem: "Limite de Empresas Atingido"

**ENTERPRISE:**
1. Conseguir criar múltiplas empresas sem bloqueio

#### Teste 2.2: Limite de Planos OGSM
**FREE:**
1. Criar 1 plano OGSM
2. Tentar criar 2º plano
3. Verificar modal de upgrade

**PRO:**
1. Criar até 3 planos OGSM
2. Tentar criar 4º plano
3. Verificar modal de upgrade

**ENTERPRISE:**
1. Conseguir criar múltiplos planos sem bloqueio

#### Teste 2.3: Limite de Objetivos
**FREE:**
1. Criar até 3 objetivos
2. Tentar criar 4º objetivo
3. Verificar modal: "Limite de Objetivos Atingido"

**PRO e ENTERPRISE:**
1. Conseguir criar objetivos sem bloqueio

#### Teste 2.4: Limite de Iniciativas
**FREE:**
1. Em um objetivo, criar até 5 iniciativas
2. Tentar criar 6ª iniciativa
3. Verificar modal: "Limite de Iniciativas Atingido"

**PRO e ENTERPRISE:**
1. Conseguir criar iniciativas sem bloqueio

#### Teste 2.5: Limite de Membros
**FREE:**
1. Tentar convidar um membro
2. Verificar modal: "Limite de Membros Atingido"

**PRO:**
1. Convidar até 3 membros
2. Tentar convidar 4º membro
3. Verificar modal de upgrade

**ENTERPRISE:**
1. Conseguir convidar membros sem bloqueio

### Passo 3: Testes de Features (Manual)

#### Teste 3.1: ICE Score
**FREE:**
1. Ir para uma iniciativa
2. Tentar abrir ICE Score Form/Wizard
3. Verificar bloqueio com UpgradePrompt

**PRO e ENTERPRISE:**
1. Conseguir usar ICE Score normalmente

#### Teste 3.2: 5W2H
**FREE:**
1. Ir para uma iniciativa
2. Tentar abrir 5W2H Form/Wizard
3. Verificar bloqueio com UpgradePrompt

**PRO e ENTERPRISE:**
1. Conseguir usar 5W2H normalmente

#### Teste 3.3: 4DX/WBR
**FREE:**
1. Tentar acessar WBR Plan
2. Verificar bloqueio com UpgradePrompt

**PRO e ENTERPRISE:**
1. Conseguir usar 4DX/WBR normalmente

#### Teste 3.4: Exportação PDF
**FREE:**
1. Exportar Plano Estratégico
2. Verificar marca d'água: "Criado com Estratégia IA - Faça upgrade para remover"
3. Toast deve mencionar "Faça upgrade para remover a marca d'água"

**PRO:**
1. Exportar Plano Estratégico
2. PDF sem marca d'água (modo standard)
3. Toast de sucesso normal

**ENTERPRISE:**
1. Exportar Plano Estratégico
2. PDF sem marca d'água (modo premium)
3. Toast: "Exportação premium entregue com sucesso"

#### Teste 3.5: Templates
**FREE:**
- Templates básicos e customizados devem estar bloqueados

**PRO:**
- Templates básicos disponíveis
- Templates customizados bloqueados

**ENTERPRISE:**
- Templates básicos e customizados disponíveis

#### Teste 3.6: Integrações
**FREE e PRO:**
- Feature bloqueada

**ENTERPRISE:**
- Feature disponível

#### Teste 3.7: Audit Log
**FREE e PRO:**
- Feature bloqueada

**ENTERPRISE:**
- Feature disponível (quando implementada)

### Passo 4: Testes de UI/UX

1. **Página de Pricing**
   - Verificar se tabela de comparação está atualizada
   - Badge "Plano Atual" aparece corretamente
   - Limites exibidos corretamente em cada card

2. **UpgradePrompt Modal**
   - Aparece nos momentos corretos
   - Mensagens personalizadas por tipo de limite
   - Botões de upgrade funcionando

3. **Dashboard**
   - Uso atual vs. limites sendo exibido
   - Não deve haver erros de console

## Checklist de Validação Final

### Base de Dados
- [ ] Planos configurados com limites corretos
- [ ] Trigger de atribuição automática do FREE funcionando
- [ ] Subscriptions ativas para cada conta

### Interface
- [ ] useSubscriptionLimits retorna valores corretos
- [ ] hasFeature funciona para todas as features
- [ ] canCreate* métodos funcionam corretamente
- [ ] pdfExportMode retorna valor correto do banco

### Bloqueios
- [ ] Modais de upgrade aparecem nos limites
- [ ] Features bloqueadas mostram UpgradePrompt
- [ ] Mensagens são claras e específicas

### Comportamento
- [ ] FREE tem marca d'água no PDF
- [ ] PRO e Enterprise não têm marca d'água
- [ ] Limites ilimitados (999999) funcionam como esperado

## Problemas Conhecidos

Nenhum problema conhecido no momento. Reporte qualquer issue encontrado.

## Próximos Passos (Fase 5 - Opcional)

- [ ] Implementar sistema de audit log para Enterprise
- [ ] Adicionar templates customizados
- [ ] Implementar integrações externas
- [ ] Sistema de permissões avançadas
- [ ] Alertas quando atingir 80% dos limites
- [ ] Dashboard administrativo para analytics de uso
