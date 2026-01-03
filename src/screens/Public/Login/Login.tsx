import React, {useEffect, useRef, useState} from "react";
import { useNavigate, useSearchParams} from "react-router-dom";
import { Label } from "../../../components/ui/label.tsx";
import { Checkbox } from "../../../components/ui/checkbox.tsx";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon } from "lucide-react";
import {clearAllAppInfo, LOGIN_URL, setAppInfo} from "../../../lib/api.ts";
import {CInput} from "../../../components/form/CInput.tsx";
import {LoadingButton} from "../../../components/feedback/LoadingButton.tsx";
import {AlertCard} from "../../../components/feedback/AlertCard.tsx";
import {useToast} from "../../../components/feedback/Toast.tsx";
import { getAppInfo } from "../../../lib/httpClient.ts";
// import {RefreshedView} from "../../../components/RefreshedView/RefreshedView.tsx";
import {useRefresh} from "../../../lib/hooks.ts";



export const Login = (): JSX.Element => {
  const { hardRefresh } = useRefresh();
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const {show} = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [notReady, setNotReady] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate('/register');
  };

  const handleLogin = () => {
      if (formRef.current) {
          // @ts-ignore
          formRef.current.requestSubmit(); // Modern browsers
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
      clearAllAppInfo();
      setDisabled(!disabled);
      if(email === "" ) {
          e.preventDefault();
          setDisabled(false);
          show({ type: "error", title: "Email is required", message: "Email cannot be empty" });
          return;
      }
      if(password === "") {
          e.preventDefault();
          setDisabled(false);
          show({ type: "error", title: "Password is required", message: "Password cannot be empty" });
          return;
      }
      handleLogin();
  }

    useEffect(() => {
        // This solves the auth code from the auth url issue
        const isApp = getAppInfo('isApp');
        // This help solves the auth code needed after a failed login attempt
        setHasError(getAppInfo('hasError') !== null);
        const isErr = searchParams.get('error') !== null;
        console.log(isApp);
        if(isErr) {
            setAppInfo("hasError", "true");
            navigate('/');
        }
        if(!isApp) {
            hardRefresh('/');
        }else {
            setNotReady(false);
        }
    }, []);

    // @ts-ignore
    return (
    <div className="min-h-screen bg-gray-5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-14 mx-auto mb-6 rounded-lg flex items-center justify-center">
              <div className="relative w-[45.38px] h-[49px] bg-[url(/vector.png)] bg-[100%_100%]" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-80 mb-2 tracking-tight">
            Sign In to Your Account
          </h1>
          
          <p className="text-lg text-slate-600 font-normal leading-relaxed">
            Login to manage your account
          </p>
            <div className={`${hasError? '':'hidden'} items-center justify-center`}>
            {/*<div className={`${searchParams.get('error') !== null? '':'hidden'} items-center justify-center`}>*/}
                <AlertCard intent="error" title="Bad Credentials">
                    The <strong>username</strong> or <strong>Password</strong> provided is incorrect.
                </AlertCard>
            </div>
        </div>

        {/* Form */}
        <form ref={formRef} className="space-y-6"
              action={LOGIN_URL}
              // action={searchParams.get('error')? LOGIN_URL + '&error' : LOGIN_URL}
              method="POST"
              onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="space-y-2">
            <Label 
              htmlFor="email" 
              className="text-sm font-bold text-gray-80 tracking-tight"
            >
              Email address
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon className="h-5 w-5text-slate-600" />
              </div>
                <CInput
                    id="email"
                    name="username"
                    label="-"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    pattern={"^\\S+@\\S+\\.\\S+$"}
                    patternMessage="Please enter a valid email address"
                    info="We’ll never share your email."
                    className="pl-10 h-12 bg-white border-gray-30 rounded-full text-slate-600 font-medium tracking-tight focus:border-brand-60 focus:ring-brand-60"
                    validate={(v) => (v.endsWith(".con") ? "Did you mean .com?" : null)}
                />
            </div>
          </div>

            {/*<CInput name="email" label="Email" validate={[required(), email()]} />*/}

          {/* Password Field */}
          <div className="space-y-2">
            <Label 
              htmlFor="password" 
              className="text-sm font-bold text-gray-80 tracking-tight"
            >
              Password
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-slate-600" />
              </div>
                <CInput
                    id="password"
                    name="password"
                    label="-"
                    type={showPassword ? "text" : "password"}
                    placeholder="*****************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    info="We’ll never share your password."
                    className="pl-10 h-12 bg-white border-gray-30 rounded-full text-slate-600 font-medium tracking-tight focus:border-brand-60 focus:ring-brand-60"
                    validate={(v) => (v.toString() === "" ? "Password empty" : null)}
                />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-slate-600 hover:text-gray-80 transition-colors" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-slate-600 hover:text-gray-80 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              // @ts-ignore
              onCheckedChange={setRememberMe}
              className="w-4 h-4 rounded-md border-gray-30 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
            />
            <Label 
              htmlFor="remember" 
              className="text-sm font-semibold text-gray-80 tracking-tight cursor-pointer"
            >
              Remember Me
            </Label>
          </div>

          {/* Forgot Password */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors tracking-tight"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
            <LoadingButton type="submit"
                           loading={disabled}
                           disabled={notReady}
                           className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-full tracking-tight transition-all duration-200 shadow-lg hover:shadow-xl">
                Sign in
            </LoadingButton>

          {/* Don't have an account */}
          <div className="text-center space-y-4">
            <p className="text-sm font-bold text-gray-80 tracking-tight">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={handleSignUpClick}
                className="text-primary-500 hover:text-primary-600 transition-colors font-bold"
              >
                Sign Up
              </button>
            </p>
          </div>
         {/*<RefreshedView />*/}
        </form>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-30">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p className="text-base font-bold text-slate-600 tracking-tight">
              Copyright 2025 ESGC ©
            </p>
            <div className="flex items-center space-x-8">
              <button className="text-base font-medium text-primary-500 hover:text-primary-600 transition-colors tracking-tight">
                Privacy Policy
              </button>
              <button className="text-base font-medium text-primary-500 hover:text-primary-600 transition-colors tracking-tight">
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};