import { useState } from "react";
import { useUser } from "./context/UserContext.jsx";
import { I18nProvider } from "./i18n/I18nContext.jsx";
import { detectLanguage } from "./i18n/detect.js";
import AuthScreen from "./components/AuthScreen.jsx";
import TabBar from "./components/TabBar.jsx";
import Home from "./components/Home.jsx";
import Assistant from "./components/Assistant.jsx";
import Upcoming from "./components/Upcoming.jsx";
import You from "./components/You.jsx";

export default function App() {
  const { user, ready } = useUser();
  const [tab, setTab] = useState("home");

  // Before sign-in there's no saved language, so start from the browser's and
  // let the sign-up form switch it live as the user picks.
  const [authLanguage, setAuthLanguage] = useState(detectLanguage);

  // Once signed in, the account's language wins.
  const language = user?.language || authLanguage;

  return (
    <I18nProvider language={language}>
      <AppShell
        ready={ready}
        user={user}
        tab={tab}
        setTab={setTab}
        authLanguage={authLanguage}
        setAuthLanguage={setAuthLanguage}
      />
    </I18nProvider>
  );
}

function AppShell({ ready, user, tab, setTab, authLanguage, setAuthLanguage }) {
  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-muted">
        <div className="w-6 h-6 border-2 border-line border-t-pitch rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen language={authLanguage} onLanguageChange={setAuthLanguage} />;
  }

  const screen =
    tab === "home" ? (
      <Home />
    ) : tab === "assistant" ? (
      <Assistant />
    ) : tab === "upcoming" ? (
      <Upcoming />
    ) : (
      <You onSignedOut={() => setTab("home")} />
    );

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 overflow-y-auto pb-2">{screen}</div>
      <TabBar tab={tab} onTab={setTab} />
    </div>
  );
}
