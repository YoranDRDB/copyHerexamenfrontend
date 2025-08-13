# API Endpoints

In dit document vind je een overzicht van de API endpoints die de webservice aanbiedt.  
Alle endpoints zijn RESTful en retourneren JSON.

## Authentication

### POST /auth/signup

- **Invoer (JSON body)**: `{ "username": "string", "email": "string", "password": "string" }`
- **Uitvoer**: `{ "user": { ...userObject }, "token": "JWT string" }`
- **Omschrijving**: Registreert een nieuwe gebruiker en geeft een JWT terug.

### POST /auth/login

- **Invoer (JSON body)**: `{ "email": "string", "password": "string" }`
- **Uitvoer**: `{ "user": { ...userObject }, "token": "JWT string" }`
- **Omschrijving**: Logt een bestaande gebruiker in en geeft een JWT terug.

## Users

> **Opmerking**: Toegang tot onderstaande endpoints vereist een geldig JWT token.  
> Rol-based toegang kan worden toegepast (b.v. sommige acties alleen voor admins).

### GET /users

- **Uitvoer**: `[ { ...userObject }, { ...userObject } ]`
- **Omschrijving**: Haalt een lijst op van alle gebruikers (alleen voor admin).

### GET /users/:id

- **Uitvoer**: `{ ...userObject }`
- **Omschrijving**: Haalt één gebruiker op aan de hand van het id.

### POST /users

- **Invoer (JSON body)**: `{ "username": "string", "email": "string", "password": "string", "role": "string" }`
- **Uitvoer**: `{ ...userObject }`
- **Omschrijving**: Creëert een nieuwe gebruiker (alleen admin).

### PUT /users/:id

- **Invoer (JSON body)**: `{ "username"?: "string", "email"?: "string", "password"?: "string", "role"?: "string" }`
- **Uitvoer**: `{ ...userObject }`
- **Omschrijving**: Update een gebruiker (admin of eigenaar van account).

### DELETE /users/:id

- **Uitvoer**: `{ "message": "User deleted" }`
- **Omschrijving**: Verwijdert een gebruiker (admin of eigenaar van account).

## Projects

> **Opmerking**: Alle project-endpoints vereisen een geldig JWT token.

### GET /projects

- **Uitvoer**: `[ { ...projectObject }, { ...projectObject } ]`
- **Omschrijving**: Haalt alle projecten op waar de ingelogde gebruiker toegang toe heeft (bijvoorbeeld eigenaar of deelnemer).

### GET /projects/:id

- **Uitvoer**: `{ ...projectObject }`
- **Omschrijving**: Haalt een specifiek project op (enkel als de gebruiker eigenaar of deelnemer is).

### POST /projects

- **Invoer (JSON body)**: `{ "name": "string", "description"?: "string" }`
- **Uitvoer**: `{ ...projectObject }`
- **Omschrijving**: Creëert een nieuw project, de aanmeldde gebruiker wordt owner.

### PUT /projects/:id

- **Invoer (JSON body)**: `{ "name"?: "string", "description"?: "string" }`
- **Uitvoer**: `{ ...projectObject }`
- **Omschrijving**: Werkt een project bij (alleen door de eigenaar).

### DELETE /projects/:id

- **Uitvoer**: `{ "message": "Project deleted" }`
- **Omschrijving**: Verwijdert een project (alleen door de eigenaar).

## Tasks

> **Opmerking**: Alle task-endpoints vereisen een geldig JWT token.  
> Een gebruiker moet toegang hebben tot het bijhorende project om de taak te kunnen beheren.

### GET /tasks

- **Query parameters**: `project_id` (optioneel, om te filteren)
- **Uitvoer**: `[ { ...taskObject }, { ...taskObject } ]`
- **Omschrijving**: Haalt een lijst taken op. Indien `project_id` is meegegeven, worden alleen taken van dat project weergegeven.

### GET /tasks/:id

- **Uitvoer**: `{ ...taskObject, "tags": [...], "assignees": [...] }`
- **Omschrijving**: Haalt een specifieke taak op, inclusief gekoppelde tags en toegewezen gebruikers.

### POST /tasks

- **Invoer (JSON body)**: `{ "project_id": "number", "title": "string", "description"?: "string", "status"?: "string", "priority"?: "string", "due_date"?: "YYYY-MM-DD" }`
- **Uitvoer**: `{ ...taskObject }`
- **Omschrijving**: Creëert een nieuwe taak binnen een project waar de gebruiker toegang toe heeft.

### PUT /tasks/:id

- **Invoer (JSON body)**: `{ "title"?: "string", "description"?: "string", "status"?: "string", "priority"?: "string", "due_date"?: "YYYY-MM-DD" }`
- **Uitvoer**: `{ ...taskObject }`
- **Omschrijving**: Werkt een taak bij.

### DELETE /tasks/:id

- **Uitvoer**: `{ "message": "Task deleted" }`
- **Omschrijving**: Verwijdert een taak.

### Toevoegen/Verwijderen van assignees

#### POST /tasks/:id/assignees

- **Invoer (JSON body)**: `{ "user_id": "number" }`
- **Uitvoer**: `{ "message": "Assignee added" }`
- **Omschrijving**: Voegt een gebruiker toe aan de taak als assignee (als de ingelogde user hier toestemming voor heeft).

#### DELETE /tasks/:id/assignees/:user_id

- **Uitvoer**: `{ "message": "Assignee removed" }`
- **Omschrijving**: Verwijdert een gebruiker als assignee van de taak.

### Toevoegen/Verwijderen van tags

#### POST /tasks/:id/tags

- **Invoer (JSON body)**: `{ "tag_id": "number" }`
- **Uitvoer**: `{ "message": "Tag added to task" }`
- **Omschrijving**: Koppelt een tag aan een taak.

#### DELETE /tasks/:id/tags/:tag_id

- **Uitvoer**: `{ "message": "Tag removed from task" }`
- **Omschrijving**: Ontkoppelt een tag van een taak.

## Tags

> **Opmerking**: Toegang vereist een geldig JWT token.

### GET /tags

- **Uitvoer**: `[ { ...tagObject }, { ...tagObject } ]`
- **Omschrijving**: Haalt alle tags op.

### GET /tags/:id

- **Uitvoer**: `{ ...tagObject }`
- **Omschrijving**: Haalt één specifieke tag op.

### POST /tags

- **Invoer (JSON body)**: `{ "name": "string" }`
- **Uitvoer**: `{ ...tagObject }`
- **Omschrijving**: Creëert een nieuwe tag.

### PUT /tags/:id

- **Invoer (JSON body)**: `{ "name"?: "string" }`
- **Uitvoer**: `{ ...tagObject }`
- **Omschrijving**: Werkt een tag bij.

### DELETE /tags/:id

- **Uitvoer**: `{ "message": "Tag deleted" }`
- **Omschrijving**: Verwijdert een tag.
