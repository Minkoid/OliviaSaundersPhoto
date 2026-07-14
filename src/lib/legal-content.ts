import type { LegalSection } from '@/components/site/legal-page';

/**
 * Placeholder legal copy. Warm, plain-English, minimal — intended as a credible
 * starting point that MUST be reviewed by a qualified professional before launch.
 */

export const LEGAL_UPDATED = 'the date shown on publication';

export const privacyContent: { intro: string; sections: LegalSection[] } = {
  intro:
    'This studio takes a minimal, respectful approach to personal data. We collect only what we need to correspond with you and to deliver your photographs.',
  sections: [
    {
      heading: 'What we collect',
      body: [
        'When you make an enquiry, we collect your name, email address, and any details you choose to share about your commission.',
        'When you are given access to a private gallery, we store your name and email address to authenticate you, along with your gallery favourites and a record of downloads for your own convenience and our accounting.',
      ],
    },
    {
      heading: 'How we use it',
      body: [
        'We use your details solely to reply to enquiries, to arrange and deliver commissioned work, and to give you secure access to your galleries.',
        'We do not sell your data, and we do not use it for advertising.',
      ],
    },
    {
      heading: 'Storage and security',
      body: [
        'Photographs are held in access-controlled cloud storage. Private galleries are never publicly listed or indexed, and images are served through short-lived, authorised links.',
        'Passwords are stored only as secure one-way hashes.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it, subject to any legal obligations to retain records.',
        'To make a request, please contact the studio using the details on the contact page.',
      ],
    },
  ],
};

export const cookiesContent: { intro: string; sections: LegalSection[] } = {
  intro:
    'We keep cookies to a minimum. By default this site uses only the strictly necessary cookies required to keep you signed in securely.',
  sections: [
    {
      heading: 'Essential cookies',
      body: [
        'A secure, http-only session cookie is used to keep you signed in to your private gallery or the studio administration area. It is not used for tracking.',
      ],
    },
    {
      heading: 'Analytics',
      body: [
        'If privacy-conscious analytics are enabled, they are cookieless and collect only aggregate, anonymous usage information. No personal data is gathered and you are not tracked across other websites.',
      ],
    },
    {
      heading: 'Managing cookies',
      body: [
        'You can clear or block cookies through your browser settings. Blocking the essential session cookie will prevent you from signing in to private areas.',
      ],
    },
  ],
};

export const termsContent: { intro: string; sections: LegalSection[] } = {
  intro:
    'These terms set out the basis on which the studio website and its services are provided. Commission-specific terms are agreed separately in writing.',
  sections: [
    {
      heading: 'Use of this website',
      body: [
        'You may browse and enjoy the public portfolio for personal, non-commercial purposes. All photographs and site content remain the property of the studio.',
      ],
    },
    {
      heading: 'Enquiries',
      body: [
        'Submitting an enquiry does not create a contract. Commissions are confirmed only once terms and any booking arrangements are agreed in writing.',
      ],
    },
    {
      heading: 'Liability',
      body: [
        'The website is provided in good faith. To the extent permitted by law, the studio is not liable for any loss arising from use of the website itself.',
      ],
    },
  ],
};

export const galleryTermsContent: { intro: string; sections: LegalSection[] } = {
  intro:
    'Private client galleries are provided for your enjoyment and convenience. The following terms apply to their use.',
  sections: [
    {
      heading: 'Access',
      body: [
        'Your gallery is private to you and any people you are expressly permitted to share access with. Please do not share your sign-in details.',
        'Galleries may have an expiry date, after which access will close. Please download anything you wish to keep before then.',
      ],
    },
    {
      heading: 'Downloads',
      body: [
        'Where downloads are enabled, images are provided for your personal use. Availability of full-resolution files depends on your commission agreement.',
      ],
    },
    {
      heading: 'Care of your images',
      body: [
        'We recommend keeping your own backup of any downloaded images. While we retain work carefully, galleries are not intended as a permanent archive.',
      ],
    },
  ],
};

export const imageUsageContent: { intro: string; sections: LegalSection[] } = {
  intro:
    'Photographs made by the studio are creative works protected by copyright. This page summarises how they may be used.',
  sections: [
    {
      heading: 'Copyright',
      body: [
        'Copyright in all photographs remains with the studio unless otherwise agreed in writing.',
      ],
    },
    {
      heading: 'Personal use',
      body: [
        'Clients are granted a licence for personal use of their images — to print, to share with family and friends, and to enjoy at home. Selling images or entering them into competitions without permission is not permitted.',
      ],
    },
    {
      heading: 'Commercial use',
      body: [
        'Any commercial or promotional use requires a separate licence, agreed in advance. Please contact the studio to discuss.',
      ],
    },
    {
      heading: 'Credit',
      body: [
        'When sharing images publicly, a courtesy credit to the studio is always appreciated.',
      ],
    },
  ],
};
