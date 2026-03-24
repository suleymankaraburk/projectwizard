# ProjectWizard UI

Angular standalone tabanli, Project Workflow backend endpointlerine bagli onboarding ve task takip arayuzu.

## Tech Stack
- Angular 21 (standalone component architecture)
- TypeScript strict mode
- Angular Material + SCSS
- Reactive Forms
- RxJS (`takeUntilDestroyed`, operator zinciri)

## Calistirma
```bash
npm install
npm start
```

## Build
```bash
npm run build
```

## Test
```bash
npm test
```

## Mock API Fallback
- Ayar: `src/environments/environment.ts`
- Flag: `useMockApi`
  - `true`: Servis local mock data dondurur
  - `false`: Gercek endpoint cagirilir (`/api/ProjectWorkflow`)

## Ekran Akslari
1. **Proje Listesi** (`/`)
   - Company filtreleme
   - Durum badge
   - Progress kartlari
2. **Proje Olusturma** (`/projects/create`)
   - `companyId + name` formu
   - Basarili kayitta proje detayina yonlenme
3. **Template Builder** (`/templates`)
   - Template olusturma
   - Step ekleme
   - Step altina soru ekleme
4. **Proje Detay / Sorular** (`/projects/:id`)
   - Template uygulama
   - Proje custom soru ekleme/silme
   - Cevap kaydetme
5. **Task Board** (`/tasks/:projectId`)
   - Cevaplardan task rebuild
   - Task/subtask status guncelleme
   - `OpenUrl` / `ShowMappedData` aksiyon UI
6. **Progress Dashboard** (`/progress/:projectId`)
   - Genel completion
   - Step bazli completed/total

## Klasorleme
- `src/app/core`: model, api client, guard, interceptor
- `src/app/shared`: reusable ui component, pipe, util
- `src/app/features/project-workflow`: sayfalar, bileşenler, servisler
