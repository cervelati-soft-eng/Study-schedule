# Firebase Setup Rapido

Este guia resume os passos para conectar o app `estudos` ao Firebase.

## 1) Criar projeto e app web

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Crie um projeto.
3. Adicione um app Web.
4. Copie as credenciais e preencha o `firebaseConfig` em `app.js`.

## 2) Ativar Auth com Google

1. Entre em **Authentication**.
2. Abra **Sign-in method**.
3. Ative o provedor **Google**.

## 3) Ativar Firestore

1. Entre em **Firestore Database**.
2. Crie o banco.
3. Defina regras iniciais para leitura/escrita por usuario autenticado.

## 4) Regras recomendadas (dev)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cronogramas/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 5) Executar o app

Rode com servidor local para suportar imports de modulo ES:

```bash
npx serve .
```

## 6) Estrutura salva no Firestore

- Collection: `cronogramas`
- Doc ID: `uid` do usuario
- Conteudo: objeto com os dias (`seg` a `dom`) e listas de blocos.
