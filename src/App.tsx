import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './screens/Public/Login/Login';
import { SignUp } from './screens/Public/SignUp/SignUp';
import { ResetPassword } from './screens/Public/ResetPassword/ResetPassword';
import { Dashboard } from './screens/Admin/Dashboard/Dashboard';
import { Dashboard as AppDashboard } from './screens/App/Dashboard/Dashboard';
import { Report } from './screens/Admin/Report/Report';
import { Report as AppReport } from './screens/App/Report/Report';
import { Operator } from './screens/Admin/Operator/Operator';
import { OperatorDetails } from './screens/Admin/OperatorDetails/OperatorDetails';
import { Team } from './screens/Team';
import { LGA } from './screens/LGA';
import { Settings } from './screens/Settings';
import { Home } from './screens/Home/Home';
import {LoginRedirect} from "./screens/Auth/LoginRedirect";
import {ProcessLogin} from "./screens/Auth/ProcessLogin";
import {LoadAuthorities} from "./screens/Auth/LoadAuthorities";
import {Profile} from "./screens/Auth/Profile";
import {SignOut} from "./screens/Public/SignOut";
import {ToastProvider} from "./components/feedback/Toast.tsx";
import {OtpVerify} from "./screens/Auth/OtpVerify/OtpVerify.tsx";
import {ChangeUserPassword} from "./screens/Public/ChangeUserPassword";
import {EmailActivate} from "./screens/Auth/EmailActivate/EmailActivate.tsx";
import {Adjudicator} from "./screens/Adjudicator";
import {RequirePermission} from "./components/auth/RequirePermission.tsx";
import {RequireRole} from "./components/auth/RequireRole.tsx";
import {RolePromoter} from "./screens/App/RolePromoter";
import {AuthEventsGuard} from "./components/auth/AuthEventsGuard.tsx";
import {ApiUsage} from "./screens/Admin/ApiUsage/ApiUsage.tsx";
import {OrganizationInfo} from "./screens/App/OrganizationInfo/OrganizationInfo.tsx";
import {ApiKeyManagement} from "./screens/App/ApiKeyManagement/ApiKeyManagement.tsx";
import {Partners} from "./screens/Admin/Partners/Partners.tsx";
import {PartnerApiKey} from "./screens/Admin/Partners/PartnerApiKey.tsx";
import {Slas} from "./screens/Admin/Slas/Slas.tsx";
import {PartnerAgreements} from "./screens/Admin/PartnerAgreements/PartnerAgreements.tsx";
import {VerificationAudit} from "./screens/Admin/VerificationAudit/VerificationAudit.tsx";

export const App: React.FC = () => {
    return (
        <ToastProvider>
            <Router>
              <AuthEventsGuard />
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home"  element={<Home />} />
                <Route path="/auth/login" element={<LoginRedirect />} />
                <Route path="/process/auth/login" element={<ProcessLogin />} />
                <Route path="/logout" element={<SignOut />} />
                <Route path="/complete/login/profile" element={<Profile />} />
                <Route path="/authorizing/login" element={<LoadAuthorities />} />
                <Route path="/register" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-otp" element={<OtpVerify />} />
                <Route path="/verify/email" element={<EmailActivate />} />
                <Route path="/admin/dashboard" element={
                    <RequirePermission anyOf={["CAN_VIEW_DASHBOARD"]}>
                        <Dashboard />
                    </RequirePermission>
                } />
                <Route path="/app/dashboard" element={<AppDashboard />} />
                <Route path="/admin/reports" element={
                    <RequirePermission anyOf={["CAN_VIEW_REPORTS"]}>
                        <Report />
                    </RequirePermission>
                } />
                <Route path="/app/reports" element={<AppReport />} />
                <Route path="/app/organization" element={<OrganizationInfo />} />
                <Route path="/app/developer" element={<ApiKeyManagement />} />
                <Route path="/admin/partners" element={
                    <RequireRole role="admin">
                        <Partners />
                    </RequireRole>
                } />
                <Route path="/admin/partners/api-key" element={
                    <RequireRole role="admin">
                        <PartnerApiKey />
                    </RequireRole>
                } />
                <Route path="/admin/slas" element={
                    <RequireRole role="admin">
                        <Slas />
                    </RequireRole>
                } />
                <Route path="/admin/partner-agreements" element={
                    <RequireRole role="admin">
                        <PartnerAgreements />
                    </RequireRole>
                } />
                <Route path="/admin/verification-audit" element={
                    <RequireRole role="admin">
                        <VerificationAudit />
                    </RequireRole>
                } />
                <Route path="/operators" element={
                    <RequirePermission anyOf={["CAN_VIEW_OPERATORS"]}>
                        <Operator />
                    </RequirePermission>
                } />
                <Route path="/operator-details/:id" element={
                    <RequirePermission anyOf={["CAN_VIEW_OPERATOR"]}>
                        <OperatorDetails />
                    </RequirePermission>
                } />
                <Route path="/admin/api/dashboard" element={
                      <RequirePermission anyOf={["CAN_VIEW_DASHBOARD"]}>
                          <ApiUsage />
                      </RequirePermission>
                } />
                <Route path="/team" element={<Team />} />
                <Route path="/lga" element={<LGA />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/change/password" element={<ChangeUserPassword />} />
                <Route path="/finalize/login" element={<Adjudicator />} />
                <Route path="/operator/setup" element={<RolePromoter />} />
              </Routes>
            </Router>
        </ToastProvider>
  );
};
