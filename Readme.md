# 🎓 Online Learning Platform — Microservices Architecture

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)
![gRPC](https://img.shields.io/badge/gRPC-Protobuf-blue?style=flat-square)
![Kafka](https://img.shields.io/badge/Kafka-7.5.0-orange?style=flat-square&logo=apache-kafka)
![GraphQL](https://img.shields.io/badge/GraphQL-Apollo-pink?style=flat-square&logo=graphql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square&logo=docker)
![SQLite](https://img.shields.io/badge/SQLite3-SQL-lightblue?style=flat-square)
![RxDB](https://img.shields.io/badge/RxDB-NoSQL-red?style=flat-square)

**Plateforme de formation en ligne basée sur une architecture microservices complète**  
Développée avec Node.js · gRPC · Kafka · REST · GraphQL · Docker

</div>

---

## 📋 Table des matières

1. [Description du projet](#-description-du-projet)
2. [Architecture](#-architecture)
3. [Microservices](#-microservices)
4. [Communication gRPC](#-communication-grpc--fichiers-proto)
5. [Endpoints REST](#-endpoints-rest)
6. [Schéma GraphQL](#-schéma-graphql)
7. [Topics Kafka](#-topics-kafka)
8. [Bases de données](#-bases-de-données)
9. [Client web](#-client-web)
10. [Installation et exécution](#-installation-et-exécution)
11. [Tests Postman](#-tests-postman)
12. [Structure du projet](#-structure-du-projet)

---

## 📖 Description du projet

Ce projet est une **plateforme de formation en ligne** (similaire à Udemy/Coursera) développée selon une architecture microservices moderne. L'application permet à des étudiants de s'inscrire à des cours, suivre leur progression et obtenir des certificats de complétion.

### Objectifs techniques

- Démontrer une **séparation claire des responsabilités** entre les microservices
- Implémenter une **communication synchrone** via gRPC (HTTP/2 + Protobuf)
- Implémenter une **communication asynchrone** via Apache Kafka
- Exposer une **interface REST** et **GraphQL** via l'API Gateway
- Utiliser des **bases de données indépendantes** pour chaque microservice

### Justification du sujet

Le sujet "Plateforme de formation en ligne" justifie naturellement toutes les technologies requises :
- **REST** : opérations CRUD classiques (créer un cours, s'inscrire, consulter)
- **GraphQL** : dashboard étudiant flexible (choisir exactement les champs nécessaires)
- **gRPC** : communication interne rapide entre Gateway et microservices
- **Kafka** : événements asynchrones (inscription → initialisation progression, leçon terminée → mise à jour stats)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
│              (Navigateur / Postman / Interface Web)              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST (HTTP/1.1 + JSON)
                          │ GraphQL (HTTP/1.1 + JSON)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                │
│                    Node.js · Port 3000                           │
│          Express REST + Apollo GraphQL + gRPC Clients            │
│                    JWT Middleware Auth                            │
└──────────┬──────────────────┬──────────────────┬───────────────┘
           │ gRPC             │ gRPC             │ gRPC
           │ HTTP/2+Protobuf  │ HTTP/2+Protobuf  │ HTTP/2+Protobuf
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│  USER SERVICE    │ │  COURSE SERVICE  │ │  PROGRESS SERVICE    │
│  Port 50051      │ │  Port 50052      │ │  Port 50053          │
│  SQLite3 (SQL)   │ │  SQLite3 (SQL)   │ │  RxDB (NoSQL)        │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────┘
         │                    │                       │
         │    ┌───────────────┴───────────────────────┘
         │    │           Apache Kafka Broker
         └────┤              Port 9092
              │    ┌─────────────────────────────┐
              └───►│  Topics :                    │
                   │  • user.registered           │
                   │  • course.enrolled           │
                   │  • lesson.completed          │
                   └─────────────────────────────┘
```

### Flux de communication

| De | Vers | Protocole | Sens |
|---|---|---|---|
| Client | API Gateway | REST / GraphQL | Synchrone |
| API Gateway | Microservices | gRPC (HTTP/2 + Protobuf) | Synchrone |
| user-service | Kafka | Publish `user.registered` | Asynchrone |
| course-service | Kafka | Publish `course.enrolled` | Asynchrone |
| progress-service | Kafka | Consume `course.enrolled` | Asynchrone |
| progress-service | Kafka | Publish `lesson.completed` | Asynchrone |
| course-service | Kafka | Consume `lesson.completed` | Asynchrone |

---

## 🔧 Microservices

### Vue d'ensemble

| Service | Port | Base de données | Rôle principal |
|---|---|---|---|
| **api-gateway** | 3000 | — | Point d'entrée REST + GraphQL |
| **user-service** | 50051 | SQLite3 | Gestion des utilisateurs et authentification |
| **course-service** | 50052 | SQLite3 | Gestion des cours, leçons et inscriptions |
| **progress-service** | 50053 | RxDB (NoSQL) | Suivi progression et génération certificats |

---

### 1. API Gateway (`api-gateway/`)

Point d'entrée unique de l'application. Reçoit toutes les requêtes clients et les redirige vers les microservices appropriés via gRPC.

**Responsabilités :**
- Exposer les endpoints REST via Express.js
- Exposer l'interface GraphQL via Apollo Server
- Vérifier les tokens JWT (middleware d'authentification)
- Appeler les microservices via gRPC (ne contient pas de logique métier)
- Gérer les erreurs HTTP et retourner des réponses cohérentes

**Technologies :** Express.js, Apollo Server 4, @grpc/grpc-js, JWT

---

### 2. User Service (`user-service/`)

Microservice responsable de toute la gestion des comptes utilisateurs.

**Responsabilités :**
- Inscription des étudiants et formateurs (hash bcrypt du mot de passe)
- Authentification et génération de tokens JWT
- Gestion des profils (lecture, modification, suppression)
- Validation des tokens JWT pour les autres services
- Publication d'événements Kafka lors de l'inscription

**Technologies :** @grpc/grpc-js, better-sqlite3, bcryptjs, jsonwebtoken, kafkajs

---

### 3. Course Service (`course-service/`)

Microservice responsable de la gestion complète des cours et des inscriptions.

**Responsabilités :**
- Création et gestion des cours (CRUD complet)
- Gestion des leçons avec ordre de passage
- Inscription des étudiants aux cours
- Publication d'événements Kafka lors des inscriptions
- Consommation d'événements Kafka pour les statistiques

**Technologies :** @grpc/grpc-js, better-sqlite3, kafkajs, uuid

---

### 4. Progress Service (`progress-service/`)

Microservice responsable du suivi de progression et des certificats.

**Responsabilités :**
- Initialisation de la progression à 0% lors d'une inscription
- Mise à jour du pourcentage de progression
- Marquage des leçons comme terminées
- Génération de certificats (nécessite 100% de complétion)
- Consommation d'événements Kafka (course.enrolled) pour init automatique
- Publication d'événements Kafka (lesson.completed) pour les stats

**Technologies :** @grpc/grpc-js, rxdb, kafkajs, uuid

---

## ⚡ Communication gRPC — Fichiers .proto

Les fichiers `.proto` définissent les contrats d'interface entre l'API Gateway et les microservices. Ils constituent la source de vérité pour toute la communication interne.

### `proto/user.proto` — UserService

```protobuf
syntax = "proto3";
package user;

service UserService {
  rpc RegisterUser    (RegisterRequest)  returns (UserResponse);
  rpc LoginUser       (LoginRequest)     returns (AuthResponse);
  rpc GetUser         (UserRequest)      returns (UserResponse);
  rpc UpdateUser      (UpdateRequest)    returns (UserResponse);
  rpc DeleteUser      (UserRequest)      returns (DeleteResponse);
  rpc ValidateToken   (TokenRequest)     returns (ValidationResponse);
}
```

| Méthode | Description | Paramètres |
|---|---|---|
| `RegisterUser` | Créer un nouveau compte | name, email, password, role |
| `LoginUser` | Connexion et génération JWT | email, password |
| `GetUser` | Récupérer un profil utilisateur | user_id |
| `UpdateUser` | Modifier nom et email | user_id, name, email |
| `DeleteUser` | Supprimer un compte | user_id |
| `ValidateToken` | Vérifier un token JWT | token |

---

### `proto/course.proto` — CourseService

```protobuf
syntax = "proto3";
package course;

service CourseService {
  rpc CreateCourse    (CreateCourseRequest)  returns (CourseResponse);
  rpc GetCourse       (CourseRequest)        returns (CourseResponse);
  rpc ListCourses     (ListCoursesRequest)   returns (CourseList);
  rpc UpdateCourse    (UpdateCourseRequest)  returns (CourseResponse);
  rpc DeleteCourse    (CourseRequest)        returns (DeleteResponse);
  rpc EnrollStudent   (EnrollRequest)        returns (EnrollResponse);
  rpc GetEnrollments  (EnrollmentRequest)    returns (EnrollmentList);
  rpc CreateLesson    (CreateLessonRequest)  returns (LessonResponse);
  rpc GetLessons      (CourseRequest)        returns (LessonList);
}
```

| Méthode | Description |
|---|---|
| `CreateCourse` | Créer un nouveau cours |
| `GetCourse` | Obtenir les détails d'un cours |
| `ListCourses` | Lister les cours avec filtres optionnels |
| `UpdateCourse` | Modifier un cours existant |
| `DeleteCourse` | Supprimer un cours |
| `EnrollStudent` | Inscrire un étudiant à un cours |
| `GetEnrollments` | Lister les inscriptions d'un étudiant |
| `CreateLesson` | Ajouter une leçon à un cours |
| `GetLessons` | Récupérer les leçons d'un cours |

---

### `proto/progress.proto` — ProgressService

```protobuf
syntax = "proto3";
package progress;

service ProgressService {
  rpc InitProgress        (InitProgressRequest)    returns (ProgressResponse);
  rpc UpdateProgress      (UpdateProgressRequest)  returns (ProgressResponse);
  rpc GetProgress         (GetProgressRequest)     returns (ProgressResponse);
  rpc GetAllProgress      (UserProgressRequest)    returns (ProgressList);
  rpc CompleteLesson      (CompleteLessonRequest)  returns (ProgressResponse);
  rpc GenerateCertificate (CertificateRequest)     returns (CertificateResponse);
}
```

| Méthode | Description |
|---|---|
| `InitProgress` | Initialiser la progression à 0% |
| `UpdateProgress` | Mettre à jour le pourcentage |
| `GetProgress` | Obtenir la progression sur un cours |
| `GetAllProgress` | Obtenir tous les cours d'un étudiant |
| `CompleteLesson` | Marquer une leçon comme terminée |
| `GenerateCertificate` | Générer un certificat (100% requis) |

---

## 📡 Endpoints REST

Tous les endpoints REST sont exposés par l'API Gateway sur le port **3000**.

### 🔐 Authentification

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Créer un nouveau compte | ❌ |
| `POST` | `/auth/login` | Connexion → retourne token JWT | ❌ |

**Exemple Register :**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Ben Ali",
    "email": "ahmed@example.com",
    "password": "123456",
    "role": "student"
  }'
```

**Réponse :**
```json
{
  "user_id": "uuid-xxxx",
  "name": "Ahmed Ben Ali",
  "email": "ahmed@example.com",
  "role": "student",
  "created_at": "2026-05-15T00:00:00.000Z"
}
```

---

### 👤 Utilisateurs

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users/:id` | Obtenir le profil d'un utilisateur | ✅ |
| `PUT` | `/users/:id` | Modifier le profil | ✅ |
| `DELETE` | `/users/:id` | Supprimer le compte | ✅ |

---

### 📚 Cours

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/courses` | Lister tous les cours | ❌ |
| `GET` | `/courses?category=X&level=Y` | Filtrer les cours | ❌ |
| `GET` | `/courses/:id` | Détail d'un cours | ❌ |
| `POST` | `/courses` | Créer un cours | ✅ |
| `PUT` | `/courses/:id` | Modifier un cours | ✅ |
| `DELETE` | `/courses/:id` | Supprimer un cours | ✅ |
| `POST` | `/courses/:id/enroll` | S'inscrire à un cours | ✅ |
| `GET` | `/courses/:id/lessons` | Leçons d'un cours | ❌ |
| `POST` | `/courses/:id/lessons` | Ajouter une leçon | ✅ |

**Exemple Create Course :**
```bash
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Node.js Microservices",
    "description": "Apprendre les microservices",
    "category": "Programming",
    "level": "intermediate"
  }'
```

---

### 📊 Progression

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/progress/:userId/:courseId/init` | Initialiser la progression | ✅ |
| `GET` | `/progress/:userId` | Tous les cours d'un étudiant | ✅ |
| `GET` | `/progress/:userId/:courseId` | Progression sur un cours | ✅ |
| `PUT` | `/progress/:userId/:courseId` | Mettre à jour le % | ✅ |
| `POST` | `/progress/:userId/:courseId/complete-lesson` | Terminer une leçon | ✅ |
| `POST` | `/progress/:userId/:courseId/certificate` | Générer un certificat | ✅ |

---

### 🏥 Health Check

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Vérifier le statut de l'API Gateway |

**Réponse :**
```json
{
  "status": "OK",
  "service": "API Gateway",
  "timestamp": "2026-05-15T00:00:00.000Z"
}
```

---

## 🔷 Schéma GraphQL

L'interface GraphQL est disponible sur `http://localhost:3000/graphql`

### Types principaux

```graphql
type User {
  user_id:    String
  name:       String
  email:      String
  role:       String
  created_at: String
}

type Course {
  course_id:   String
  title:       String
  description: String
  instructor:  String
  category:    String
  level:       String
  created_at:  String
}

type Progress {
  user_id:           String
  course_id:         String
  percentage:        Float
  completed_lessons: [String]
  last_activity:     String
  is_completed:      Boolean
}

type Certificate {
  certificate_id: String
  user_id:        String
  course_id:      String
  issued_at:      String
  success:        Boolean
}
```

### Queries disponibles

```graphql
type Query {
  getUser(user_id: String!): User
  getCourse(course_id: String!): Course
  listCourses(category: String, level: String): [Course]
  getLessons(course_id: String!): [Lesson]
  getEnrollments(user_id: String!): [Enrollment]
  getProgress(user_id: String!, course_id: String!): Progress
  getAllProgress(user_id: String!): [Progress]
}
```

### Mutations disponibles

```graphql
type Mutation {
  register(name: String!, email: String!, password: String!, role: String): User
  login(email: String!, password: String!): AuthPayload
  createCourse(title: String!, description: String, category: String, level: String): Course
  enrollStudent(user_id: String!, course_id: String!): Enrollment
  createLesson(course_id: String!, title: String!, content: String, order_num: Int): Lesson
  completeLesson(user_id: String!, course_id: String!, lesson_id: String!): Progress
  updateProgress(user_id: String!, course_id: String!, percentage: Float!): Progress
  generateCertificate(user_id: String!, course_id: String!): Certificate
}
```

### Justification de GraphQL

GraphQL est utilisé pour le **dashboard étudiant** qui nécessite des données précises et flexibles. Contrairement à REST qui retourne des objets entiers, GraphQL permet au client de demander exactement les champs nécessaires — idéal pour un dashboard qui affiche titre + progression + dernière activité sans charger toutes les données du cours.

### Exemples de requêtes GraphQL

**Dashboard étudiant complet :**
```graphql
query {
  getAllProgress(user_id: "USER_ID") {
    course_id
    percentage
    completed_lessons
    is_completed
    last_activity
  }
}
```

**Recherche de cours avec filtres :**
```graphql
query {
  listCourses(category: "Programming", level: "beginner") {
    course_id
    title
    instructor
    level
  }
}
```

**Inscription via mutation :**
```graphql
mutation {
  enrollStudent(
    user_id: "USER_ID"
    course_id: "COURSE_ID"
  ) {
    user_id
    course_id
    enrolled_at
  }
}
```

---

## 📬 Topics Kafka

Apache Kafka est utilisé pour la **communication asynchrone** entre les microservices, permettant leur découplage total. Les événements sont déclenchés par des actions métier réelles — pas artificiellement.

### Topic 1 : `user.registered`

| Champ | Valeur |
|---|---|
| **Producteur** | user-service |
| **Consommateur** | — (extensible pour notifications futures) |
| **Déclencheur** | Un nouvel utilisateur s'inscrit sur la plateforme |

**Format du message :**
```json
{
  "userId": "uuid-xxxx",
  "name": "Ahmed Ben Ali",
  "email": "ahmed@example.com",
  "role": "student"
}
```

**Scénario métier :** Quand un étudiant crée son compte, l'événement est publié pour permettre à d'autres services (notifications, recommandations) de réagir sans couplage direct.

---

### Topic 2 : `course.enrolled`

| Champ | Valeur |
|---|---|
| **Producteur** | course-service |
| **Consommateur** | progress-service |
| **Déclencheur** | Un étudiant s'inscrit à un cours |

**Format du message :**
```json
{
  "userId": "uuid-xxxx",
  "courseId": "uuid-yyyy",
  "enrolledAt": "2026-05-15T00:00:00.000Z"
}
```

**Scénario métier :** Quand un étudiant s'inscrit à un cours, le course-service publie cet événement. Le progress-service le consomme et initialise automatiquement la progression de l'étudiant à 0% dans RxDB — sans que les deux services se connaissent directement.

---

### Topic 3 : `lesson.completed`

| Champ | Valeur |
|---|---|
| **Producteur** | progress-service |
| **Consommateur** | course-service |
| **Déclencheur** | Un étudiant termine une leçon |

**Format du message :**
```json
{
  "userId": "uuid-xxxx",
  "courseId": "uuid-yyyy",
  "lessonId": "uuid-zzzz",
  "completedAt": "2026-05-15T00:00:00.000Z"
}
```

**Scénario métier :** Quand un étudiant marque une leçon comme terminée, le progress-service publie cet événement. Le course-service le consomme pour mettre à jour les statistiques du cours (nombre de leçons complétées par les étudiants).

---

### Flux Kafka complet

```
┌─────────────────┐    user.registered     ┌──────────────────┐
│  user-service   │ ──────────────────────► │  (notifications) │
└─────────────────┘                         └──────────────────┘

┌─────────────────┐    course.enrolled      ┌──────────────────┐
│ course-service  │ ──────────────────────► │progress-service  │
└─────────────────┘                         │  → init 0%       │
                                            └──────────────────┘

┌─────────────────┐    lesson.completed     ┌──────────────────┐
│progress-service │ ──────────────────────► │ course-service   │
└─────────────────┘                         │  → update stats  │
                                            └──────────────────┘
```

---

## 🗄️ Bases de données

Chaque microservice possède sa propre base de données indépendante — aucun service n'accède à la base d'un autre.

### User Service — SQLite3 (SQL)

**Fichier :** `user-service/src/db/users.db`

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- bcrypt hash
  role        TEXT DEFAULT 'student', -- 'student' ou 'instructor'
  created_at  TEXT DEFAULT (datetime('now'))
);
```

**Justification SQLite3 :** Les données utilisateurs sont structurées et relationnelles (unicité email, rôles définis), ce qui justifie une base SQL avec contraintes.

---

### Course Service — SQLite3 (SQL)

**Fichier :** `course-service/src/db/courses.db`

```sql
CREATE TABLE courses (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  instructor  TEXT NOT NULL,
  category    TEXT,
  level       TEXT DEFAULT 'beginner',
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE lessons (
  id        TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title     TEXT NOT NULL,
  content   TEXT,
  order_num INTEGER DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE enrollments (
  user_id     TEXT NOT NULL,
  course_id   TEXT NOT NULL,
  enrolled_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id)
);
```

**Justification SQLite3 :** Les cours, leçons et inscriptions sont des données relationnelles avec des clés étrangères et des contraintes d'unicité (un étudiant ne peut pas s'inscrire deux fois au même cours).

---

### Progress Service — RxDB (NoSQL)

**Répertoire :** `progress-service/src/db/progress_db`

**Collection `progress` :**
```json
{
  "id": "userId_courseId",
  "user_id": "uuid-xxxx",
  "course_id": "uuid-yyyy",
  "percentage": 65,
  "completed_lessons": ["lesson-1", "lesson-2", "lesson-3"],
  "last_activity": "2026-05-15T00:00:00.000Z",
  "is_completed": false
}
```

**Collection `certificates` :**
```json
{
  "id": "uuid-cert",
  "user_id": "uuid-xxxx",
  "course_id": "uuid-yyyy",
  "issued_at": "2026-05-15T00:00:00.000Z"
}
```

**Justification RxDB :** La progression est un document dynamique dont le tableau `completed_lessons` grandit au fil du temps. Un stockage NoSQL orienté document est plus adapté qu'un schéma SQL rigide pour ce type de données flexible et évolutif.

---

## 🖥️ Client web

Une interface web complète est disponible dans le dossier `client/`.

**Fonctionnalités :**
- Dashboard avec statistiques (cours disponibles, inscriptions, cours complétés)
- Inscription et connexion (JWT automatiquement géré)
- Parcourir et filtrer les cours
- S'inscrire aux cours en un clic
- Créer des cours et des leçons
- Suivre sa progression avec barres de progression visuelles
- Générer des certificats
- GraphQL Explorer intégré (queries et mutations)

**Accès :** Ouvrir `client/index.html` dans le navigateur avec le projet lancé.

---

## 🚀 Installation et exécution

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) v20+
- [Docker Compose](https://docs.docker.com/compose/) v2+
- [Node.js](https://nodejs.org/) v20+ *(pour développement local uniquement)*
- [Git](https://git-scm.com/)

---

### Option 1 — Docker Compose (recommandé)

```bash
# 1. Cloner le repository
git clone https://github.com/boudriga007/online_learning_platform.git
cd online_learning_platform

# 2. Lancer tous les services
docker-compose up --build

# 3. Vérifier que tout fonctionne
curl http://localhost:3000/health
# Réponse attendue : {"status":"OK","service":"API Gateway"}

# 4. Arrêter les services
docker-compose down
```

**Services démarrés :**

| Container | Port | Description |
|---|---|---|
| zookeeper | 2181 | Requis par Kafka |
| kafka | 9092 | Broker de messages |
| user-service | 50051 | gRPC User Service |
| course-service | 50052 | gRPC Course Service |
| progress-service | 50053 | gRPC Progress Service |
| api-gateway | 3000 | REST + GraphQL |

---

### Option 2 — Développement local (sans Docker)

```bash
# Terminal 1 — Kafka (via Docker)
docker-compose up zookeeper kafka

# Terminal 2 — User Service
cd user-service
npm install
npm run dev

# Terminal 3 — Course Service
cd course-service
npm install
npm run dev

# Terminal 4 — Progress Service
cd progress-service
npm install
npm run dev

# Terminal 5 — API Gateway
cd api-gateway
npm install
npm run dev
```

---

### Vérification du démarrage

Les logs suivants indiquent que tous les services sont opérationnels :

```
✅ SQLite3 Database initialized (user-service)
✅ Kafka Producer connected (user-service)
🚀 User Service gRPC running on port 50051

✅ SQLite3 Database initialized (course-service)
✅ Kafka Producer connected (course-service)
✅ Kafka Consumer connected (course-service)
🚀 Course Service gRPC running on port 50052

✅ RxDB Database initialized (progress-service)
✅ Kafka Producer connected (progress-service)
✅ Kafka Consumer connected (progress-service)
🚀 Progress Service gRPC running on port 50053

🚀 API Gateway running on http://localhost:3000
📡 REST  → http://localhost:3000/auth | /users | /courses | /progress
🔷 GraphQL → http://localhost:3000/graphql
```

---

## 🧪 Tests Postman

Une collection Postman complète est disponible pour tester tous les endpoints.

**Fichier :** `docs/postman_collection.json`

### Importer la collection

```
1. Ouvrir Postman
2. File → Import
3. Sélectionner docs/postman_collection.json
4. Créer l'environnement "OLP Environment" avec :
   - base_url = http://localhost:3000
   - token    = (auto-rempli au login)
   - user_id  = (auto-rempli au register)
   - course_id = (auto-rempli à la création)
   - lesson_id = (auto-rempli à la création)
```

### Ordre d'exécution des tests

```
Auth/Register → Auth/Login → Users/Get User →
Courses/Create → Courses/List → Lessons/Create →
Courses/Enroll → Progress/Init → Progress/Complete Lesson →
Progress/Update 100% → Progress/Certificate →
GraphQL/listCourses → GraphQL/getAllProgress
```

### Scénario de test complet (curl)

```bash
BASE=http://localhost:3000

# 1. Inscription
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","email":"ahmed@test.com","password":"123456","role":"student"}'

# 2. Connexion
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@test.com","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 3. Créer un cours
COURSE=$(curl -s -X POST $BASE/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Node.js","description":"Microservices","category":"Programming","level":"intermediate"}')
echo $COURSE

# 4. S'inscrire et suivre la progression
# ... (voir collection Postman pour la suite)
```

---

## 📁 Structure du projet

```
online-learning-platform/
│
├── 📄 docker-compose.yml          # Orchestration des 6 containers
├── 📄 README.md                   # Documentation complète
├── 📄 .gitignore
│
├── 📁 proto/                      # Contrats gRPC (source de vérité)
│   ├── user.proto                 # Interface UserService (6 méthodes)
│   ├── course.proto               # Interface CourseService (9 méthodes)
│   └── progress.proto             # Interface ProgressService (6 méthodes)
│
├── 📁 api-gateway/                # Point d'entrée — Port 3000
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js               # Express + Apollo Server
│       ├── grpc-clients/          # Clients gRPC vers les microservices
│       │   ├── user.client.js
│       │   ├── course.client.js
│       │   └── progress.client.js
│       ├── rest/                  # Routes REST
│       │   ├── middleware.js      # JWT auth middleware
│       │   └── routes/
│       │       ├── auth.routes.js
│       │       ├── users.routes.js
│       │       ├── courses.routes.js
│       │       └── progress.routes.js
│       └── graphql/               # GraphQL
│           ├── schema.js          # Types + Queries + Mutations
│           └── resolvers.js       # Résolution via gRPC
│
├── 📁 user-service/               # Microservice Users — Port 50051
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js               # Serveur gRPC
│       ├── grpc-server/
│       │   └── handler.js         # Implémentation des 6 méthodes
│       ├── kafka/
│       │   └── producer.js        # Publie user.registered
│       └── db/
│           └── database.js        # SQLite3 — table users
│
├── 📁 course-service/             # Microservice Courses — Port 50052
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js
│       ├── grpc-server/
│       │   └── handler.js         # Implémentation des 9 méthodes
│       ├── kafka/
│       │   ├── producer.js        # Publie course.enrolled
│       │   └── consumer.js        # Consomme lesson.completed
│       └── db/
│           └── database.js        # SQLite3 — tables courses, lessons, enrollments
│
├── 📁 progress-service/           # Microservice Progress — Port 50053
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js
│       ├── grpc-server/
│       │   └── handler.js         # Implémentation des 6 méthodes
│       ├── kafka/
│       │   ├── producer.js        # Publie lesson.completed
│       │   └── consumer.js        # Consomme course.enrolled → init 0%
│       └── db/
│           └── database.js        # RxDB — collections progress, certificates
│
├── 📁 client/                     # Interface web client
│   └── index.html                 # Dashboard complet (REST + GraphQL)
│
└── 📁 docs/                       # Documentation
    └── postman_collection.json    # Collection de tests Postman
```

---

## 🛠️ Variables d'environnement

### api-gateway/.env
```env
PORT=3000
GRPC_USER_SERVICE=localhost:50051
GRPC_COURSE_SERVICE=localhost:50052
GRPC_PROGRESS_SERVICE=localhost:50053
JWT_SECRET=super_secret_key_2025
```

### user-service/.env
```env
GRPC_PORT=50051
JWT_SECRET=super_secret_key_2025
DB_PATH=./src/db/users.db
KAFKA_BROKER=localhost:9092
```

### course-service/.env
```env
GRPC_PORT=50052
DB_PATH=./src/db/courses.db
KAFKA_BROKER=localhost:9092
```

### progress-service/.env
```env
GRPC_PORT=50053
DB_PATH=./src/db/progress_db
KAFKA_BROKER=localhost:9092
```

---

## 📦 Dépendances principales

| Package | Version | Usage |
|---|---|---|
| `@grpc/grpc-js` | ^1.10.0 | Serveur/Client gRPC |
| `@grpc/proto-loader` | ^0.7.10 | Chargement des .proto |
| `express` | ^4.18.2 | Serveur REST |
| `@apollo/server` | ^4.10.0 | Serveur GraphQL |
| `kafkajs` | ^2.2.4 | Client Kafka |
| `better-sqlite3` | ^9.4.3 | Base SQLite3 |
| `rxdb` | ^15.0.0 | Base NoSQL RxDB |
| `jsonwebtoken` | ^9.0.2 | Auth JWT |
| `bcryptjs` | ^2.4.3 | Hash mots de passe |

---

## 👨‍💻 Auteur

**Ahmed Boudriga**  
Projet académique — Module SoA et Microservices  
Encadrant : Dr. Salah Gontara  
Année universitaire : 2025-26

---

## 📜 Licence

Ce projet est développé dans le cadre académique de l'université.