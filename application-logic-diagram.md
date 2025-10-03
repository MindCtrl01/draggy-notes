# Draggy Notes Application Logic Diagram

This document contains a comprehensive logic diagram of the Draggy Notes application architecture, showing the complete system flow, components, and data relationships.

## System Architecture Overview

```mermaid
graph TB
    %% User Interface Layer
    subgraph "User Interface Layer"
        UI[NotesCanvas Component]
        NC[NoteCard Components]
        ND[NoteDetail Modal]
        CM[Calendar Sidebar]
        SS[Search Sidebar]
        QNT[Quick Note Tabs]
        LM[Login Modal]
        TM[Tag Manager]
        TD[Tag Display]
        ST[Sync Status Indicator]
    end

    %% Context Providers
    subgraph "Context Providers"
        AC[AuthContext]
        SC[SyncContext]
        TC[ThemeContext]
    end

    %% Custom Hooks
    subgraph "Custom Hooks"
        UNA[useNotes Hook]
        UAU[useAuth Hook]
        UST[useSyncStatus Hook]
        UNE[useNoteEditing Hook]
        UCD[useCanvasDrag Hook]
        UTS[useTags Hook]
    end

    %% Core Services
    subgraph "Core Services"
        NS[NotesSyncService]
        SSV[SignalRService]
        QM[QueueManager]
        TSS[TagsSyncService]
    end

    %% API Layer
    subgraph "API Layer"
        NA[NotesAPI]
        AA[AuthAPI]
        TA[TagsAPI]
        BA[BaseAPI]
    end

    %% Data Storage
    subgraph "Data Storage"
        LS[localStorage]
        API[Backend API]
        SR[SignalR Hub]
    end

    %% Domain Models
    subgraph "Domain Models"
        N[Note Entity]
        T[Tag Entity]
        U[User Entity]
        NT[NoteTask Entity]
    end

    %% Helper Classes
    subgraph "Helper Classes"
        NSH[NotesStorage]
        TMH[TagManager]
        TKM[TokenManager]
        TH[TaskManager]
        CH[CalendarHelper]
        DH[DateHelper]
    end

    %% External Dependencies
    subgraph "External Dependencies"
        RQ[React Query]
        RR[React Router]
        MT[Mantine UI]
        LC[Lucide Icons]
        TW[Tailwind CSS]
    end

    %% Connections
    UI --> UNA
    UI --> UCD
    UI --> AC
    UI --> SC
    
    NC --> ND
    NC --> UNE
    NC --> TD
    
    ND --> TM
    ND --> UTS
    
    UNA --> NS
    UNA --> NSH
    
    UAU --> AA
    UAU --> TKM
    
    UST --> NS
    UST --> SSV
    UST --> QM
    
    NS --> NA
    NS --> QM
    NS --> NSH
    NS --> SSV
    
    SSV --> SR
    
    QM --> LS
    
    NA --> API
    AA --> API
    TA --> API
    
    BA --> API
    
    NSH --> LS
    TMH --> LS
    TKM --> LS
    
    AC --> UAU
    SC --> UST
    
    UNA --> N
    UTS --> T
    UAU --> U
    UNE --> NT
    
    %% Styling
    classDef uiLayer fill:#e1f5fe
    classDef contextLayer fill:#f3e5f5
    classDef hookLayer fill:#e8f5e8
    classDef serviceLayer fill:#fff3e0
    classDef apiLayer fill:#fce4ec
    classDef storageLayer fill:#f1f8e9
    classDef domainLayer fill:#e0f2f1
    classDef helperLayer fill:#fff8e1
    classDef externalLayer fill:#f5f5f5
    
    class UI,NC,ND,CM,SS,QNT,LM,TM,TD,ST uiLayer
    class AC,SC,TC contextLayer
    class UNA,UAU,UST,UNE,UCD,UTS hookLayer
    class NS,SSV,QM,TSS serviceLayer
    class NA,AA,TA,BA apiLayer
    class LS,API,SR storageLayer
    class N,T,U,NT domainLayer
    class NSH,TMH,TKM,TH,CH,DH helperLayer
    class RQ,RR,MT,LC,TW externalLayer
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as LoginModal
    participant AC as AuthContext
    participant AA as AuthAPI
    participant TM as TokenManager
    participant NS as NotesSyncService
    participant API as Backend API

    U->>UI: Enter credentials
    UI->>AC: login(credentials)
    AC->>AA: login(credentials)
    AA->>API: POST /api/auth/login
    API-->>AA: AuthenticationResponse
    AA->>TM: setToken(token)
    AA->>TM: setRefreshToken(refreshToken)
    AA-->>AC: AuthenticationResponse
    AC->>NS: handleUserLogin()
    NS->>NS: startSyncTimer()
    AC-->>UI: Success
    UI-->>U: Login successful
```

## Note Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as NotesCanvas
    participant UNA as useNotes Hook
    participant NS as NotesSyncService
    participant NSH as NotesStorage
    participant QM as QueueManager
    participant API as Backend API

    U->>UI: Double-click canvas
    UI->>UNA: createNote(position)
    UNA->>NS: createNote(position, content)
    NS->>NSH: saveNote(note)
    NSH->>NSH: localStorage.setItem()
    NSH-->>NS: Note saved locally
    NS->>QM: addToQueue(noteUuid, 'create')
    QM->>QM: localStorage.setItem(queue)
    NS-->>UNA: Note created
    UNA-->>UI: Update UI
    
    Note over NS,QM: Background sync process
    NS->>QM: getPrimaryQueue()
    QM-->>NS: Queue items
    NS->>API: POST /api/notes (batch)
    API-->>NS: Created notes
    NS->>QM: removeMultipleFromPrimaryQueue()
    NS->>NSH: updateNoteWithServerData()
```

## Real-time Synchronization Flow

```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant C2 as Client 2
    participant SR as SignalR Hub
    participant SSV as SignalRService
    participant NS as NotesSyncService
    participant NSH as NotesStorage

    C1->>NS: updateNote()
    NS->>NSH: saveNote()
    NS->>API: PUT /api/notes
    API->>SR: Broadcast NotesUpdated
    SR->>SSV: NotesUpdated event
    SSV->>SSV: handleNotesUpdated()
    SSV->>NSH: getNote(uuid)
    SSV->>SSV: Check version conflict
    alt Server version newer
        SSV->>NSH: saveNote(serverNote)
        SSV->>NS: notifyEventHandlers()
        NS->>C2: forceReloadAllNotes()
    else Local version newer
        SSV->>SSV: Keep local version
    end
```

## Offline-First Data Flow

```mermaid
graph LR
    subgraph "Online Mode"
        A[User Action] --> B[Save to localStorage]
        B --> C[Add to Sync Queue]
        C --> D[Background Sync]
        D --> E[Update Server]
        E --> F[Remove from Queue]
    end
    
    subgraph "Offline Mode"
        G[User Action] --> H[Save to localStorage]
        H --> I[Add to Sync Queue]
        I --> J[Queue Persisted]
        J --> K[Wait for Online]
    end
    
    subgraph "Sync Recovery"
        L[Back Online] --> M[Process Queue]
        M --> N[Retry Failed Items]
        N --> O[Sync to Server]
    end
    
    K --> L
    F --> A
    O --> A
```

## Tag System Integration

```mermaid
graph TB
    subgraph "Tag Management"
        TM[TagManager Component]
        TD[TagDisplay Component]
        TS[TagSuggestion Component]
    end
    
    subgraph "Tag Services"
        TSS[TagsSyncService]
        TA[TagsAPI]
        TMH[TagManager Helper]
    end
    
    subgraph "Tag Storage"
        TLS[localStorage Tags]
        TAPI[Backend Tags API]
    end
    
    subgraph "Note Integration"
        N[Note Entity]
        NC[NoteCard Component]
        ND[NoteDetail Component]
    end
    
    TM --> TSS
    TD --> TSS
    TS --> TSS
    
    TSS --> TA
    TSS --> TMH
    
    TA --> TAPI
    TMH --> TLS
    
    N --> TD
    NC --> TD
    ND --> TM
    
    TM --> N
    TD --> N
```

## Component Hierarchy

```mermaid
graph TD
    A[App.tsx] --> B[QueryClientProvider]
    B --> C[ThemeProvider]
    C --> D[AuthProvider]
    D --> E[SyncProvider]
    E --> F[TooltipProvider]
    F --> G[BrowserRouter]
    
    G --> H[Routes]
    H --> I[Index Page]
    H --> J[Login Page]
    H --> K[Register Page]
    H --> L[NotFound Page]
    
    I --> M[NotesCanvas]
    M --> N[CalendarSidebar]
    M --> O[QuickNoteTabs]
    M --> P[SearchSidebar]
    M --> Q[NoteCard Components]
    M --> R[LoginModal]
    M --> S[ThemeToggle]
    M --> T[SyncStatusIndicator]
    
    Q --> U[NoteDetail]
    U --> V[TagDisplay]
    U --> W[TagManager]
    U --> X[NoteTaskMode]
    U --> Y[NoteContentMode]
    
    V --> Z[TagSuggestion]
```

## Data Models and Relationships

```mermaid
erDiagram
    USER ||--o{ NOTE : creates
    USER ||--o{ TAG : owns
    NOTE ||--o{ NOTE_TASK : contains
    NOTE }o--o{ TAG : tagged_with
    
    USER {
        int id PK
        string username
        string email
        string password
        string phoneNumber
        array roles
        boolean isActive
        boolean isDelete
        datetime createdAt
        datetime updatedAt
    }
    
    NOTE {
        int id PK
        string uuid UK
        string title
        string content
        datetime date
        string color
        boolean isDisplayed
        boolean isPinned
        json position
        boolean isTaskMode
        int userId FK
        boolean isDeleted
        int syncVersion
        int localVersion
        datetime lastSyncedAt
        datetime clientUpdatedAt
        datetime createdAt
        datetime updatedAt
    }
    
    TAG {
        int id PK
        string uuid UK
        string name
        int userId FK
        int usageCount
        boolean isPreDefined
        datetime createdAt
        datetime updatedAt
    }
    
    NOTE_TASK {
        int id PK
        string uuid UK
        string text
        boolean isCompleted
        string color
        int noteId FK
        datetime createdAt
        datetime updatedAt
    }
```

## Sync Queue Management

```mermaid
stateDiagram-v2
    [*] --> PrimaryQueue: Note Operation
    PrimaryQueue --> Processing: Sync Trigger
    Processing --> Success: API Success
    Processing --> Retry: API Failure
    Retry --> Processing: Retry Attempt
    Retry --> RetryQueue: Max Retries
    RetryQueue --> PrimaryQueue: Retry Eligibility
    Success --> [*]: Complete
    RetryQueue --> [*]: Manual Retry
    
    note: Primary Queue: Immediate sync attempts
    note: Retry Queue: Failed items waiting for retry
    note: Processing: Active sync operation
    note: Success: Successfully synced
    note: Retry: Failed sync, retrying
```

This comprehensive diagram shows the complete architecture of the Draggy Notes application, including:

1. **User Interface Layer**: All React components and their relationships
2. **Context Providers**: State management for auth, sync, and theme
3. **Custom Hooks**: Business logic encapsulation
4. **Core Services**: Main application services
5. **API Layer**: Backend communication
6. **Data Storage**: localStorage and backend persistence
7. **Domain Models**: Data structures and relationships
8. **Helper Classes**: Utility functions
9. **External Dependencies**: Third-party libraries

The application follows an offline-first architecture with real-time synchronization, comprehensive authentication, and a robust tag system.
