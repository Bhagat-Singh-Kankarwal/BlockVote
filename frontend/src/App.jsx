import { BrowserRouter, Routes, Route } from 'react-router-dom';

import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";

import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import { EmailVerificationPreBuiltUI } from "supertokens-auth-react/recipe/emailverification/prebuiltui";
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui';
import * as reactRouterDom from "react-router-dom";

import { SessionAuth } from "supertokens-auth-react/recipe/session";

import { Toaster } from 'sonner';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VotingDashboard from './pages/VotingDashboard';
import Layout from './components/Layout';
import Home from './components/Home';

SuperTokens.init({
  appInfo: {
    appName: "BlockVote",
    apiDomain: import.meta.env.VITE_API_URL || "http://localhost:9010",
    websiteDomain: import.meta.env.VITE_WEBSITE_DOMAIN || "http://localhost:5173",
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },
  style: `
    [data-supertokens~=superTokensBranding] {
      display:none;
    }

    [data-supertokens~=headerTitle] {
      font-family: 'Quicksand', sans;
    }
    
    [data-supertokens~=button]:hover {
      transform: scale(1.02);
    }
  `,
  getRedirectionURL: async (context) => {
    // Handle email verification success
    if (context.action === "VERIFY_EMAIL") {
      return "/dashboard";
    }
    
    if (context.action === "SUCCESS") {
      if (context.redirectToPath !== undefined) {
        return context.redirectToPath;
      }
      return "/dashboard";
    }
    return undefined;
  },
  recipeList: [
    EmailVerification.init({
      mode: "REQUIRED",
      emailVerificationFeature: {
        disableDefaultImplementation: false
      }
    }),
    EmailPassword.init(),
    Session.init()
  ],
});

function App() {
  return (
    <SuperTokensWrapper>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Toaster position="top-right" richColors />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />

              {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [EmailPasswordPreBuiltUI, EmailVerificationPreBuiltUI])}

              <Route path='/dashboard' element={
                <SessionAuth requireAuth={true}>
                  <VotingDashboard />
                </SessionAuth>
              } />

              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </div>
      </BrowserRouter>
    </SuperTokensWrapper>
  );
}

export default App;
