
export const DB_NAME = "FutureFind";
export const DEFAULT_AVATAR_URL = "https://cdn-icons-png.flaticon.com/128/552/552721.png";

export const USER = "User";
export const OPPORTUNITY = "Opportunity";
export const APPLICATION = "Application";



// User Contants
export const USER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive"
};

export const USER_ROLES = {
    ADMIN: "admin",
    USER: "user"
};

export const ENROLLMENT_TYPE = {
    REMOTE: {
        title: "Remote",
        description: "Work from anywhere"
    },
    IN_PERSON: {
        title: "In Person",
        description: "On-site opportunities near you"
    },
    HYBRID: {
        title: "Hybrid",
        description: "A mix of remote and in-person"
    }
};
export const EMPLOYMENT_TYPE = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
}

//     CompleteVolunteerHours: {
//         title: "Complete Volunteer Hours",
//         description: "Meet community service goals"
//     },
//     LearnNewSkills: {
//         title: "Learn New Skills",
//         description: "Grow personal or career skills"
//     },
//     ParticipateInResearch: {
//         title: "Participate in Research",
//         description: "Join academic research projects"
//     },
//     SecureAnInternship: {
//         title: "Secure an Internship",
//         description: "Get real-world work experience"
//     },
//     ExploreCareers: {
//         title: "Explore Careers",
//         description: "Find your future career path"
//     },
//     LeadershipExperience: {
//         title: "Leadership Experience",
//         description: "Lead projects or group efforts"
//     },
//     ImpactMyCommunity: {
//         title: "Impact My Community",
//         description: "Make difference locally"
//     },
//     EarnCertificates: {
//         title: "Earn Certificates",
//         description: "Get recognized for your work"
//     },
//     PrepareForCollege: {
//         title: "Prepare for College",
//         description: "Boost your college profile"
//     },
//     BuildMyNetwork: {
//         title: "Build My Network",
//         description: "Connect with mentors and peers"
//     }
// }
// Opportunity Constants
export const OPPORTUNITY_STATUS = {
    OPEN: "Open",
    CLOSED: "Closed",
    PENDING: "Pending",
    ACTIVE: "Active",
    INACTIVE: "Inactive"
};


export const APPLICATION_STATUS = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
    INREVIEW :"In Review",
    APPLIED:"Applied",
    SUBMITTED:"Submitted"
};

export const REFERRAL_CODE_BASE = "USER";
export const REFERRAL_CODE_LENGTH = 8;