# DIGITRANS-SCM 🚚

> Module Supply Chain — Projet DIGITRANS-CM  
> Client : AGROCAM S.A. | CAMTECH SOLUTIONS S.A.  
> Période : Janvier 2026 — Juin 2027

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Backend | Spring Boot 3.x + Spring Security (JWT) + Spring Data JPA |
| Frontend | React 18 + TypeScript + TailwindCSS + React Query |
| Base de données | PostgreSQL 15 |
| Cache | Redis 7 |
| DevOps | Docker + GitHub Actions |
| Cloud | AWS af-south-1 (EC2, RDS, ElastiCache, CloudFront) |

## Structure du projet

```
digitrans-scm/
├── backend/          # Spring Boot API REST
├── frontend/         # React 18 + TypeScript
├── docker-compose.yml
└── README.md
```

## Équipe

| Membre | Rôle |
|--------|------|
| DONGMO WOZE | Chef de projet / Architecte Cloud |
| KENNETH TAGNE | Développeur Back-end |
| KAMGA Ludovic | DevOps / QA |

## Lancement rapide

```bash
# Cloner le repo
git clone https://github.com/wozeWilfried/digitrans-cm-supply-chain.git
cd digitrans-cm-supply-chain

# Démarrer tous les services
docker-compose up -d

# Backend : http://localhost:8080
# Frontend : http://localhost:5173
# Swagger UI : http://localhost:8080/swagger-ui.html
```

## Milestones

- [ ] M1 — Architecture & Setup
- [ ] M2 — MVP Backend APIs (Spring Boot)
- [ ] M3 — Frontend React + Offline-First
- [ ] M4 — Intégration Cloud & Tests UAT
- [ ] M5 — Recette & Mise en production

## Stratégie de branches (Git Flow)

```
main          ← Production stable (protégée, PR obligatoire)
develop       ← Intégration (base de travail quotidienne)
feature/*     ← Nouvelles fonctionnalités  ex: feature/stock-api
fix/*         ← Corrections de bugs        ex: fix/jwt-refresh
release/*     ← Préparation d'une release  ex: release/1.0.0
```

**Règles :**
- On ne pousse jamais directement sur `main`
- Toute feature part de `develop` et y revient via Pull Request
- Le CI/CD se déclenche sur `main` (deploy staging) et `develop` (tests uniquement)

## SonarQube — Quality Gate

- URL locale : http://localhost:9000 (via `docker-compose up sonarqube`)
- Couverture minimum requise : **80%** (configuré dans JaCoCo + pom.xml)
- Exclusions : entités JPA, DTOs, config, classe main

Lancer l'analyse manuellement :
```bash
cd backend
mvn clean verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<votre_token_sonar>
```
