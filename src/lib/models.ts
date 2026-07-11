// Centralized request/response payload models for API calls

// Auth
import {
    ApiKeyData,
    ApiKeyUsageData,
    ApiKeyUsageSummary,
    AgreementStatus,
    AgreementType,
    Lga, MonthlyType,
    OperatorSummary,
    PartnerAgreementData,
    PerformanceDistributionData,
    PlatformPartnerData,
    PartnerStatus,
    PartnerType,
    ServiceLevelAgreementData,
    SlaStatus,
    TrendSeriesData,
    VerificationRequestData,
    VerificationResponseData
} from "./appModels.ts";

export interface SignerConfig {
    secret: string;               // client secret or per-session key
    saltBytes: number;           // default 16
    saltFormat: 'hex'|'base64';  // default 'hex'
    tsSkewSecs: number;          // acceptable skew (for validation, optional)
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmptyRequest {}


export interface LoginResponse {
  // user: { id: string; email: string; name?: string };
    data: {
        access_token: string;
        refresh_token: string;
    };
}

export interface AuthUrlResponse {
  authorizerUrl: string;
}

// User Permissions
export interface UserPermissionResponse {
    data: {
        permissions: string[];
    };
}

// User
export interface ProfileAccount {
    data: {
        publicId: string;
        username: string;
        profile: {
            email: string;
            firstName: string;
            middleName: string;
            lastName: string;
            phoneNumber: string;
            profilePicture: string;
            settings: {
                role: string,
                isEmailVerified: boolean
            }
        }
    }
}

export interface ProfileUpdateRequest {
    profile: {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        profilePicture: string;
        settings: {
            role: string,
            isEmailVerified: boolean
        }
    }
}

export interface PasswordResetResponse {
    data: {
        message: string;
    }
}

export interface PasswordUpdateResponse {
    data: string
}

export interface OtpVerificationResponse {
    data: {
        message: string;
        publicId: string;
    }
}

// Change Password (inferred from the ChangeUserPassword screen)
// Typical backend contract: requires a current password and new password.
// Confirm password is client-side validation only, but we keep it optional in case the backend needs it.
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ChangePasswordResponse {
  data: string;
  message?: string;
}

export interface UserAccountRequest {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    phone: string;
    role: string;
    appId: string;
}

export interface UserAccountResponse {
  data: {
      publicId: string;
      message?: string;
  }
}

export interface OperatorVerificationRequest {
    firstname: string;
    lastname: string;
    phone_no: string;
    regNumber: string;
}

export interface OperatorVerificationResponse {
    data: {
        idNumber: string;
        name: string;
        address: string;
        type: string;
        contact: string;
        details: {
            id: number;
            cac?: {
                lga: string;
                city: string;
                state: string;
                rcNumber: string;
                affiliates: string;
                companyName: string;
                companyType: string;
                companyEmail: string;
                shareCapital: number;
                branchAddress: string;
                classification: string;
                registrationDate: string;
                headOfficeAddress: string;
                shareCapitalInWords: string;
            }
            nin?: {
                nin: string;
                firstname: string;
                lastname: string;
                middlename: string;
                gender: string;
                phone: string;
                picture: string;
                birthdate: string;
                residence: {
                    lga: string;
                    state: string;
                    address1: string;
                }
            }
            status: {
                state: string;
                status: string;
            }
        }
        createdOn: string;
    }
}

export interface LgaResponse {
    data: {
        page: number;
        size: number;
        totalPages: number;
        total: number;
        previous: number;
        next: number;
        data: [ Lga ]
    }
}

export interface CompanyRequest {
    registrationNumber: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    lga: string;
    contactPerson: string;
    contactPersonPhone: string;
    contactPersonEmail: string;
    userId: string;
}

export interface CompanyResponse {
    data: {
        publicId: string;
        registrationNumber: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        lga: string;
        contactPerson: string;
        contactPersonPhone: string;
        contactPersonEmail: string;
    }
}

export interface UploadRequest {
    base64Image: string;
    resourceType: string;
}
export interface UploadResponse {
    data: {
        resourceUrl: string;
    }
}

export interface GenericResponse<T> {
    data: {
        page: number;
        size: number;
        totalPages: number;
        total: number;
        previous: number;
        next: number;
        data: T[]
    }
}

export interface OperatorMetricsResponse {
    data: OperatorSummary;
}

export interface TrendSeriesResponse {
    data: TrendSeriesData[];
}

export interface PerformanceDistributionResponse {
    data: PerformanceDistributionData[];
}

export interface ApiKeyUsageSummaryResponse {
    data: ApiKeyUsageSummary[];
}

export interface ApiKeyUsageResponse {
    data: ApiKeyUsageData[];
}

export interface ApiKeyResponse {
    data: ApiKeyData;
}

export interface ApiKeyRequest {
    publicId: string;
    name: string;
    apiKey: 'default';
    role: 'OPERATOR_API_USER' | 'PARTNER_API_USER';
    rateLimitConfig: {
        remainingTokens: number | 50;
        capacity: number | 50;
        refillPeriod: number | 30;
        refillTimeUnit: string | 'SECOND';
    }
}

export interface MonthlyDataResponse {
    data: MonthlyType;
}

// Partner domain request/response models
export interface PlatformPartnerRequest {
    partnerCode: string;
    partnerName: string;
    partnerType: PartnerType;
    country?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    status?: PartnerStatus;
    userId?: string;
}

export interface ServiceLevelAgreementRequest {
    name: string;
    verificationResponseTime: number;
    updateFrequency?: string;
    status?: SlaStatus;
}

export interface PartnerAgreementRequest {
    partnerPublicId: string;
    agreementType: AgreementType;
    effectiveDate: string;
    expiryDate?: string;
    slaPublicId?: string;
    dataSharingScope?: string;
    signedDocumentUrl?: string;
    status?: AgreementStatus;
}

export interface PlatformPartnerResponse {
    data: PlatformPartnerData;
    status?: boolean;
    message?: string;
    requestId?: string | null;
}

export interface ServiceLevelAgreementResponse {
    data: ServiceLevelAgreementData;
    status?: boolean;
    message?: string;
    requestId?: string | null;
}

export interface PartnerAgreementResponse {
    data: PartnerAgreementData;
    status?: boolean;
    message?: string;
    requestId?: string | null;
}

export interface VerificationRequestResponse {
    data: VerificationRequestData;
    status?: boolean;
    message?: string;
    requestId?: string | null;
}

export interface VerificationResponseResponse {
    data: VerificationResponseData;
    status?: boolean;
    message?: string;
    requestId?: string | null;
}

export interface VoidDataResponse {
    data: null;
    status?: boolean;
    message?: string;
    requestId?: string | null;
}
