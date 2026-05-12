# Alavanca

Plataforma do CLIC (Centro de Letramento Digital) para apoio a laboratórios de inovação pública: diagnóstico, trilhas, assistente e casos.

## Stack

- **Astro** — sites multipágina, build estático, ilhas de interatividade onde necessário.
- **Vercel** — deploy via `git push` no `main`. Serverless function pro `/assistente` (a ser adicionada).
- **Sem framework de UI**, sem CSS framework. Design system inline em `src/styles/tokens.css`.

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/
npm run preview  # serve o build local
```

## Estrutura

```
src/
  layouts/
    Base.astro          # shell: <html>, fonts, grain, vignette, nav
  components/
    Nav.astro           # nav sticky com a alavanca
  styles/
    tokens.css          # design system: variáveis, tipografia, ctas, divisores
  pages/
    index.astro         # landing
    diagnostico.astro   # (próximo)
    assistente.astro    # (depois)
    ...
```

## Rotas planejadas

| Rota              | Status      | Tipo          |
|-------------------|-------------|---------------|
| `/`               | em produção | estática      |
| `/mapear`         | em produção | estática + SSR wizard  |
| `/diagnostico`    | redirect 301 → `/mapear/sprint` | SSR |
| `/assistente`     | a fazer     | estática + API |
| `/fundamentos`    | a fazer     | estática      |
| `/formalizar`     | a fazer     | estática      |
| `/estruturar`     | pós-evento  | estática      |
| `/construir`      | pós-evento  | estática      |
| `/trilhas`        | pós-evento  | estática      |
| `/casos`          | pós-evento  | estática      |
