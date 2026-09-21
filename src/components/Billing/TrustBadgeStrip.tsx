import React from 'react';
import LockIcon from '../Icons/PlanIcons/LockIcon';
import CardIcon from '../Icons/PlanIcons/CardIcon';
import LongTermIcon from '../Icons/PlanIcons/LongTermIcon';
import SecureIcon from '../Icons/PlanIcons/SecureIcon';

const features = [
  {
    icon: <LockIcon size={22}/>,
    title: '14-day free trial',
    description: 'Explore all features risk-free. Cancel anytime.',
  },
  {
    icon: <CardIcon size={24}/>,
    title: 'No Credit Card',
    description: 'Get started in seconds. No credit card required.',
  },
  {
    icon: <LongTermIcon size={20}/>,
    title: 'Cancel Anytime',
    description: 'No long-term contracts. Switch or cancel anytime.',
  },
  {
    icon: <SecureIcon size={24}/>,
    title: 'Secure & Reliable',
    description: 'Your data is always protected with enterprise-grade security.',
  },
];

export default function TrustBadgeStrip({marginTop = "mt-10"}:{marginTop?:string}) {
  return (
      <div className={`${marginTop} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 dark:border dark:border-darkBorder/50 bg-white dark:bg-darkSecondaryBg rounded-3xl p-6 shadow-[0_0_20px_8px_rgba(0,0,0,0.04)] divide-y sm:divide-y-0 sm:divide-x divide-borderColor dark:divide-darkBorder`}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className={`flex items-start space-x-4 py-4 sm:py-0 ${
                index === 0 ? 'sm:pl-0' : 'sm:pl-6'
              } ${index === features.length - 1 ? 'sm:pr-0' : 'sm:pr-6'}`}
            >
              {/* Icon Container */}
              <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                {Icon}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-headingTextColor dark:text-darkTextPrimary mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-subTextColor dark:text-darkTextSecondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
  );
}