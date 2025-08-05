# 🛡️ ComplianceSearch - AML/FT Platform

> **Next-Generation AML Screening Platform** - Streamline your compliance operations with real-time data from official OFAC, UN, EU, and Interpol sources.

[![Built with Floot](https://img.shields.io/badge/Built%20with-Floot-blue)](https://floot.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)

- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Tecnologias](#-tecnologias)
- [Roadmap](#-roadmap)
- [Contribuição](#-contribuição)

## 🎯 Visão Geral

O **ComplianceSearch** é uma plataforma SaaS profissional desenvolvida especificamente para instituições financeiras que precisam de soluções robustas de compliance AML (Anti-Money Laundering) e FT (Financial Transactions). 

A plataforma oferece busca unificada e sincronização em tempo real de listas restritivas de quatro fontes oficiais globais, garantindo que suas verificações de compliance sejam sempre atualizadas e precisas.

### 🏦 Por que usar?

- ✅ **Compliance Automatizado**: Verificação automática contra múltiplas listas restritivas
- ✅ **Dados Sempre Atualizados**: Sincronização em tempo real com fontes oficiais
- ✅ **Interface Profissional**: Design moderno e intuitivo para equipes de compliance
- ✅ **Busca Avançada**: Filtros por nome, tipo de entidade, nacionalidade e fonte
- ✅ **Auditoria Completa**: Histórico detalhado de todas as sincronizações
- ✅ **Performance**: Resultados de busca em menos de 100ms

## 🚀 Funcionalidades

### 🔍 **Busca Inteligente**
- Busca por nome com matching inteligente
- Filtros avançados por:
  - Fonte da lista (OFAC, UN, EU, Interpol)
  - Tipo de entidade (Pessoa Física/Jurídica)
  - Nacionalidade
- Paginação otimizada para grandes volumes
- Busca case-insensitive e parcial

### 🔄 **Sincronização Automática**
- **OFAC**: Dados do Tesouro Americano (sdn.xml)
- **UN**: Listas de sanções da ONU
- **EU**: Medidas restritivas da União Europeia
- **Interpol**: Lista Vermelha da Interpol
- Sincronização individual ou em lote
- Histórico completo de sincronizações

### 📊 **Painel Administrativo**
- Estatísticas em tempo real
- Monitoramento de sincronizações
- Métricas de uso da API
- Status de saúde do sistema

### 👤 **Perfis Detalhados**
Para cada entidade sancionada:
- Informações pessoais completas
- Aliases e nomes alternativos
- Endereços conhecidos
- Data e local de nascimento
- Motivo da sanção
- Número de referência oficial

## 🏗️ Arquitetura

```
📁 ComplianceSearch/
├── 🎨 Frontend (React + TypeScript)
│   ├── pages/           # Páginas da aplicação
│   ├── components/      # 40+ componentes reutilizáveis
│   └── helpers/         # Hooks e utilitários
│
├── ⚡ Backend (API Endpoints)
│   ├── search_POST.ts      # Busca de entidades
│   ├── entity_GET.ts       # Detalhes da entidade
│   ├── sync/               # Sincronização
│   │   ├── ofac_POST.ts   # Dados OFAC
│   │   ├── un_POST.ts     # Dados UN
│   │   ├── eu_POST.ts     # Dados EU
│   │   └── interpol_POST.ts # Dados Interpol
│   └── admin/              # Endpoints admin
│
└── 🗄️ Database
    ├── sanctionedEntities  # Entidades sancionadas
    └── syncHistory         # Histórico de sync
```

### 📊 Schema do Banco

**sanctionedEntities**
```sql
id                # ID único
name             # Nome da entidade
entityType       # INDIVIDUAL | ENTITY
listSource       # OFAC | UN | EU | INTERPOL
nationality      # Nacionalidade
aliases          # Nomes alternativos (array)
addresses        # Endereços (JSON)
dateOfBirth      # Data de nascimento
placeOfBirth     # Local de nascimento
reason           # Motivo da sanção
referenceNumber  # Número de referência oficial
additionalInfo   # Informações adicionais
dateAdded        # Data de adição
createdAt/updatedAt
```

## 🔧 Instalação

### Pré-requisitos
- Node.js 18+
- Banco de dados PostgreSQL
- Git

### Setup

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/compliance-search
cd compliance-search
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Configure as variáveis de ambiente
cp .env.example .env

# Execute as migrações
npm run db:migrate
```

4. **Importe os estilos CSS**
```tsx
import './FlootSetup.css'; // Configuração base do Floot
import './global.css';     // Estilos globais
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 💻 Como Usar

### 1. **Primeira Sincronização**
```bash
# Sincronize todas as fontes
curl -X POST http://localhost:3000/api/sync/all

# Ou sincronize fontes individuais
curl -X POST http://localhost:3000/api/sync/ofac
curl -X POST http://localhost:3000/api/sync/un
curl -X POST http://localhost:3000/api/sync/eu
curl -X POST http://localhost:3000/api/sync/interpol
```

### 2. **Buscar Entidades**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Putin",
    "listSources": ["OFAC", "UN"],
    "entityTypes": ["INDIVIDUAL"],
    "page": 1,
    "pageSize": 20
  }'
```

### 3. **Interface Web**
- Acesse `http://localhost:3000`
- Use a página `/search` para buscas
- Acesse `/admin` para painel administrativo
- Clique em qualquer resultado para ver detalhes completos

## 🔌 API Endpoints

### **Busca**
- `POST /api/search` - Buscar entidades sancionadas
- `GET /api/entity/:id` - Detalhes de uma entidade

### **Sincronização**
- `POST /api/sync/all` - Sincronizar todas as fontes
- `POST /api/sync/ofac` - Sincronizar dados OFAC
- `POST /api/sync/un` - Sincronizar dados UN
- `POST /api/sync/eu` - Sincronizar dados EU
- `POST /api/sync/interpol` - Sincronizar dados Interpol

### **Administração**
- `GET /api/admin/stats` - Estatísticas do sistema
- `GET /api/admin/sync-history` - Histórico de sincronizações

## 📸 Screenshots

<!-- Adicione aqui os prints que você quiser incluir -->
*Envie suas screenshots e eu as incluirei aqui com descrições apropriadas!*

**Sugestões de prints para incluir:**
- 🏠 Página inicial com hero section
- 🔍 Interface de busca com resultados
- 👤 Página de detalhes de uma entidade
- 📊 Painel administrativo com estatísticas
- 🔄 Página de sincronização
- 📱 Versão mobile/responsiva

## 🛠️ Tecnologias

### **Frontend**
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **CSS Modules** - Estilos isolados
- **Lucide React** - Ícones
- **React Router** - Roteamento
- **React Helmet** - Meta tags

### **Backend**
- **Node.js** - Runtime
- **Kysely** - Query builder TypeScript
- **PostgreSQL** - Banco de dados
- **SuperJSON** - Serialização
- **Fast XML Parser** - Parser XML
- **Zod** - Validação de schemas

### **DevEx & Tools**
- **Floot** - Framework de desenvolvimento
- **ESLint** - Linting
- **Prettier** - Formatação
- **Git** - Controle de versão

## 🗓️ Roadmap

### **Próximas Funcionalidades**
- [ ] 🔐 Autenticação e autorização
- [ ] 📧 Alertas por email para novas sanções
- [ ] 📊 Dashboard com gráficos avançados
- [ ] 🌐 API pública com rate limiting
- [ ] 📱 App mobile nativo
- [ ] 🤖 AI para detecção de matches similares
- [ ] 📄 Exportação de relatórios (PDF/Excel)
- [ ] 🔄 Webhooks para notificações
- [ ] 🌍 Múltiplos idiomas
- [ ] ☁️ Deploy em cloud (AWS/GCP)

### **Melhorias Técnicas**
- [ ] Cache Redis para performance
- [ ] Testes automatizados (Jest/Cypress)
- [ ] CI/CD pipeline
- [ ] Monitoramento e logs
- [ ] Backup automático
- [ ] Load balancing

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### **Desenvolvimento Local**
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar testes
npm test

# Build para produção
npm run build
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.


<img width="1440" height="819" alt="Screenshot 2025-08-04 at 21 54 07" src="https://github.com/user-attachments/assets/766580b4-e822-4538-8fc2-fbceac5fecd4" />
<img width="1446" height="806" alt="Screenshot 2025-08-04 at 21 51 24" src="https://github.com/user-attachments/assets/f2d7c705-ec7c-4737-877a-b0f5da4612d0" />
<img width="1455" height="825" alt="Screenshot 2025-08-04 at 21 51 42" src="https://github.com/user-attachments/assets/b6d72bfb-6486-4a01-98bf-3ed1bf02a101" />
<img width="1452" height="816" alt="Screenshot 2025-08-04 at 21 51 58" src="https://github.com/user-attachments/assets/12e5a6f3-29d6-44bd-bcce-bca87944637a" /><img width="1440" height="730" alt="Screenshot 2025-08-04 at 21 52 30" src="https://github.com/user-attachments/assets/5a70e4ca-049b-46e1-bbf7-b8b2aa4bb745" />

<img width="1457" height="782" alt="Screenshot 2025-08-04 at 21 52 14" src="https://github.com/user-attachments/assets/60e0cc3f-4eed-42b1-a531-55e1a65b872e" />









