# Cronograma de Estudos

Aplicativo web para organizar estudos por dia da semana, com sincronizacao local e em nuvem usando Firebase.

## Funcionalidades

- Visualizacao por dia (Segunda a Domingo)
- Adicao e remocao de blocos de estudo por horario
- Persistencia local com `localStorage`
- Login com Google via Firebase Authentication
- Sincronizacao de dados no Firestore por usuario

## Integracoes Firebase (ja no `app.js`)

O arquivo `app.js` esta configurado para usar:

- `firebase-app` para inicializacao
- `firebase-auth` para login/logout e observer de sessao
- `firebase-firestore` para salvar e carregar cronogramas

Cole as chaves do seu projeto no objeto:

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

## Estrutura dos dados no Firestore

- Collection: `cronogramas`
- Documento: `uid` do usuario autenticado
- Conteudo: objeto com chaves dos dias (`seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`)

Exemplo simplificado:

```json
{
  "seg": [{ "id": "abc", "time": "19:00", "topic": "Matematica" }],
  "ter": [],
  "qua": [],
  "qui": [],
  "sex": [],
  "sab": [],
  "dom": []
}
```

## Como rodar localmente

Como o app usa imports ES Modules via CDN, rode com servidor local (nao abra apenas com duplo clique):

```bash
# exemplo com VS Code Live Server
# ou com Node:
npx serve .
```

Depois acesse o endereco exibido no terminal.

## Configuracao no Firebase Console

1. Crie um projeto no Firebase.
2. Ative **Authentication > Sign-in method > Google**.
3. Ative **Firestore Database**.
4. Em **Project settings > General > Your apps (Web)**, copie as credenciais para `firebaseConfig`.
5. Em desenvolvimento, ajuste as regras do Firestore para permitir leitura/escrita do usuario autenticado.

Regra inicial recomendada (desenvolvimento):

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

## Observacoes

- Quando o usuario nao esta logado, os dados ficam apenas no `localStorage`.
- Quando o usuario faz login, o app sincroniza com o Firestore e passa a salvar na nuvem.
- Se for o primeiro login, o app envia os dados locais atuais para a nuvem.
