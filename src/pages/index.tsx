import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';

const CONSOLE_URL = 'https://console.flightroom.dev';
const GITHUB_URL = 'https://github.com/flightroom';
const SITE_URL = 'https://flightroom.dev';
const DOCS_URL = `${SITE_URL}/documentation/`;

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'Flightroom',
  url: SITE_URL,
  logo: `${DOCS_URL}img/logo.png`,
  sameAs: [GITHUB_URL],
};

// Emitted only on the documentation home: describes the site as a whole and
// the product it documents. Individual doc pages emit TechArticle instead.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${DOCS_URL}#website`,
      name: 'Flightroom documentation',
      url: DOCS_URL,
      description:
        'Documentation for Flightroom: the open-source enterprise platform where anyone builds apps and AI agents by describing them, and ships them in one click to Kubernetes.',
      inLanguage: 'en',
      publisher: ORGANIZATION,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Flightroom',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: SITE_URL,
      description:
        'Open-source enterprise platform where anyone can build applications and AI agents by ' +
        'describing them in plain language. The AI writes the code in your own Git repositories, ' +
        'your engineers review it, and one click deploys it to your Kubernetes through GitOps and ' +
        'Argo CD, with your single sign-on, your roles and your AI models. Hosted or self-hosted.',
      author: ORGANIZATION,
      publisher: ORGANIZATION,
    },
  ],
};

// Illustrative only: what an AI request on an empty domain produces. The
// labels are the console's; the names are an example.
const AI_REQUEST = `Expenses › Edit with AI

> An agent that checks each expense claim against the
  travel policy and flags the ones over the limit.

Proposed   expense-review     service · Python & FastAPI
Proposed   expenses           frontend · React (Vite)

✓ 2 repositories created from templates, CI included
✓ First version pushed to an ai/… branch of each

Open a pull request  ·  Apply  ·  Discard`;

type Stat = {value: string; label: string};

const STATS: Stat[] = [
  {value: '3', label: 'Git providers'},
  {value: '5', label: 'AI model providers'},
  {value: '4', label: 'Service templates'},
  {value: '∞', label: 'Environments'},
  {value: '1 click', label: 'Deploy'},
];

type Card = {
  icon: string;
  title: string;
  description: string;
  to: string;
  cta?: string;
  badge?: string;
};

const START_HERE: Card[] = [
  {
    icon: '🚀',
    title: 'Quick start',
    description:
      'Describe an app or an agent, let the AI write it in your repositories, review it and deploy it. Starts on the free hosted console.',
    to: '/docs/quick-start',
    cta: 'Start the quick start',
  },
  {
    icon: '🧠',
    title: 'Core concepts',
    description:
      'Organizations, projects, domains, services, environments and deployments, and how they relate. The ten minutes that save you an hour later.',
    to: '/docs/core-concepts',
    cta: 'Read the model',
  },
  {
    icon: '🔧',
    title: 'Run it yourself',
    description:
      'Install the platform on your own Kubernetes with Helm, or with Docker, Docker Compose or Terraform.',
    to: '/docs/self-hosting/helm',
    cta: 'Installation guides',
  },
];

const CAPABILITIES: Card[] = [
  {
    icon: '✨',
    title: 'Generate on an empty domain',
    description:
      'Describe what the team needs. The AI proposes up to three web interfaces and three services, you edit the list, and each repository is created from a template.',
    to: '/docs/build-with-ai/generate-a-domain',
  },
  {
    icon: '🌿',
    title: 'Every AI change on a branch',
    description:
      'Refine through chat, then open a pull request, apply where branch protection allows, or discard. Your base branch is untouched until someone acts.',
    to: '/docs/build-with-ai/ai-changes',
  },
  {
    icon: '🛡️',
    title: 'Guardrails for IT',
    description:
      'The AI cannot edit CI files or lockfiles, cannot read credential files, and each request has a size cap. Viewers cannot ask for changes.',
    to: '/docs/build-with-ai/guardrails',
  },
  {
    icon: '🧩',
    title: 'Bring your own model',
    description:
      'Claude through Anthropic, Azure AI Foundry or AWS Bedrock, GPT through Azure OpenAI, or Gemini, with your own keys, per organization.',
    to: '/docs/build-with-ai/ai-models',
  },
  {
    icon: '🚢',
    title: 'One-click deploy with Argo CD',
    description:
      'Every deploy is a Git commit your Argo CD syncs. The console never holds cluster credentials.',
    to: '/docs/kubernetes/overview',
  },
  {
    icon: '🌍',
    title: 'A namespace and a URL per environment',
    description:
      'Dev, UAT, production or your own stages, each a Kubernetes namespace, with each app on its own path and TLS from cert-manager.',
    to: '/docs/kubernetes/exposure',
  },
];

type Step = {
  title: string;
  description: string;
  to: string;
};

const STEPS: Step[] = [
  {
    title: 'Describe',
    description:
      'Write what the app or agent should do, the way you would explain it to a colleague. Flightroom proposes the web interfaces and services it needs.',
    to: '/docs/build-with-ai/overview',
  },
  {
    title: 'Generate',
    description:
      'Each repository is created in your Git provider from a template, CI included, and the AI writes the first version on a branch.',
    to: '/docs/build-with-ai/generate-a-domain',
  },
  {
    title: 'Review',
    description:
      'Open a pull request. Protect the base branch and every AI change goes through your code review and your CI.',
    to: '/docs/build-with-ai/ai-changes',
  },
  {
    title: 'Deploy',
    description:
      'One click commits the deployment to Git, your Argo CD syncs it, and the app answers on its own URL with TLS.',
    to: '/docs/kubernetes/overview',
  },
];

type DocSection = {
  title: string;
  links: {label: string; to: string}[];
};

const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Getting started',
    links: [
      {label: 'Quick start', to: '/docs/quick-start'},
      {label: "Let's start", to: '/docs/intro'},
      {label: 'Core concepts', to: '/docs/core-concepts'},
      {label: 'Architecture', to: '/docs/architecture'},
    ],
  },
  {
    title: 'Build with AI',
    links: [
      {label: 'Overview', to: '/docs/build-with-ai/overview'},
      {label: 'Generate a domain', to: '/docs/build-with-ai/generate-a-domain'},
      {label: 'AI changes', to: '/docs/build-with-ai/ai-changes'},
      {label: 'Guardrails', to: '/docs/build-with-ai/guardrails'},
      {label: 'AI models', to: '/docs/build-with-ai/ai-models'},
      {label: 'Console assistant', to: '/docs/build-with-ai/console-assistant'},
      {label: 'MCP server', to: '/docs/build-with-ai/mcp-server'},
    ],
  },
  {
    title: 'Deploy to Kubernetes',
    links: [
      {label: 'Overview', to: '/docs/kubernetes/overview'},
      {label: 'GitOps', to: '/docs/kubernetes/gitops'},
      {label: 'Argo CD', to: '/docs/kubernetes/argo-cd'},
      {label: 'Exposure and TLS', to: '/docs/kubernetes/exposure'},
      {
        label: 'Config maps and secrets',
        to: '/docs/kubernetes/config-maps-and-secrets',
      },
      {label: 'Databases', to: '/docs/kubernetes/databases'},
    ],
  },
  {
    title: 'Environments',
    links: [
      {label: 'Overview', to: '/docs/environments/overview'},
      {label: 'Allowed domains', to: '/docs/environments/domains'},
      {
        label: 'Environment variables',
        to: '/docs/environments/environment-variables',
      },
    ],
  },
  {
    title: 'Templates',
    links: [
      {label: 'Service templates', to: '/docs/templates/service-templates'},
      {label: 'Frontend templates', to: '/docs/templates/templates-library'},
    ],
  },
  {
    title: 'Repositories',
    links: [
      {label: 'GitHub', to: '/docs/repositories/connect/github'},
      {label: 'GitLab', to: '/docs/repositories/connect/gitlab'},
      {label: 'Azure DevOps', to: '/docs/repositories/connect/azure.dev-ops'},
    ],
  },
  {
    title: 'Frontends',
    links: [
      {label: 'Quick start', to: '/docs/frontends/quick-start'},
      {label: 'Overview', to: '/docs/frontends/overview'},
      {label: 'Hosts and remotes', to: '/docs/frontends/host-and-remotes'},
      {label: 'Deployments', to: '/docs/deployments/overview'},
      {label: 'Module Federation', to: '/docs/integration/overview'},
      {label: 'Storage', to: '/docs/buckets/overview'},
    ],
  },
  {
    title: 'CI/CD',
    links: [
      {label: 'API keys', to: '/docs/ci-cd/api-keys'},
      {label: 'GitHub Actions', to: '/docs/ci-cd/github-actions'},
      {label: 'GitLab CI', to: '/docs/ci-cd/gitlab-ci'},
      {label: 'Azure Pipelines', to: '/docs/ci-cd/azure-pipelines'},
    ],
  },
  {
    title: 'Organizations and members',
    links: [
      {label: 'Organizations', to: '/docs/organizations/overview'},
      {label: 'Projects', to: '/docs/project-settings/projects'},
      {label: 'Users and roles', to: '/docs/project-settings/users-and-roles'},
    ],
  },
  {
    title: 'Self-hosting',
    links: [
      {label: 'Helm (Kubernetes)', to: '/docs/self-hosting/helm'},
      {label: 'Docker Compose', to: '/docs/self-hosting/docker-compose'},
      {label: 'Docker', to: '/docs/self-hosting/docker'},
      {label: 'Terraform', to: '/docs/self-hosting/terraform'},
      {
        label: 'Environment variables',
        to: '/docs/self-hosting/environment-variables',
      },
      {label: 'Single sign-on', to: '/docs/category/enable-sso'},
    ],
  },
];

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Documentation</span>
          <Heading as="h1" className={styles.heroTitle}>
            Apps and AI agents, built by anyone,{' '}
            <span className={styles.gradientText}>shipped in one click</span>
          </Heading>
          <p className={styles.heroSubtitle}>
            Anyone in the company describes an app or an AI agent. The AI
            writes it on a branch of your own repositories, starting from
            Flightroom's templates, your engineers review it, and one click
            deploys it to your Kubernetes through GitOps and Argo CD. These
            pages cover both the hosted console and the self-hosted platform.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.buttonPrimary} to="/docs/quick-start">
              Quick start →
            </Link>
            <Link className={styles.buttonGhost} to="/docs/core-concepts">
              Core concepts
            </Link>
            <Link className={styles.buttonQuiet} to={CONSOLE_URL}>
              Open the console ↗
            </Link>
          </div>
          <ul className={styles.heroNotes}>
            <li>Hosted console or self-hosted</li>
            <li>GitHub, GitLab and Azure DevOps</li>
            <li>Argo CD and Kubernetes</li>
          </ul>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.codeCard}>
            <div className={styles.codeCardBar}>
              <span className={styles.dot} data-dot="red" />
              <span className={styles.dot} data-dot="amber" />
              <span className={styles.dot} data-dot="green" />
              <span className={styles.codeCardTitle}>Edit with AI</span>
            </div>
            <CodeBlock language="text" className={styles.codeBlock}>
              {AI_REQUEST}
            </CodeBlock>
          </div>
        </div>
      </div>
      <div className={styles.statsStrip}>
        {STATS.map((stat) => (
          <div className={styles.stat} key={stat.label}>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}

function EntryCard({icon, title, description, to, cta, badge}: Card) {
  return (
    <Link className={styles.featureCard} to={to}>
      <span className={styles.featureIcon} aria-hidden="true">
        {icon}
      </span>
      <h3 className={styles.featureTitle}>
        {title}
        {badge && <span className={styles.featureBadge}>{badge}</span>}
      </h3>
      <p className={styles.featureDescription}>{description}</p>
      <span className={styles.featureLink}>{cta ?? 'Read the docs'} →</span>
    </Link>
  );
}

function StartHere() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.kicker}>Start here</span>
        <Heading as="h2" className={styles.sectionTitle}>
          Three ways in
        </Heading>
        <p className={styles.sectionLead}>
          Depending on whether you want to try the platform, understand it, or
          run it on your own infrastructure.
        </p>
      </div>
      <div className={styles.featureGrid}>
        {START_HERE.map((card) => (
          <EntryCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className={styles.sectionAlt}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>What the platform does</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Build with AI, deploy to Kubernetes, govern it with your own tools
          </Heading>
          <p className={styles.sectionLead}>
            One platform from the first description to a live URL, on
            infrastructure you already run.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {CAPABILITIES.map((card) => (
            <EntryCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.kicker}>The short path</span>
        <Heading as="h2" className={styles.sectionTitle}>
          From a description to a live URL
        </Heading>
        <p className={styles.sectionLead}>
          The same four steps for an app or an agent, in your Git provider,
          your CI and your cluster.
        </p>
      </div>
      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li className={styles.step} key={step.title}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
              <Link className={styles.inlineLink} to={step.to}>
                Read the guide →
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DocIndex() {
  return (
    <section className={styles.sectionAlt}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Reference</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Browse the documentation
          </Heading>
          <p className={styles.sectionLead}>
            Every section of the manual, one click away.
          </p>
        </div>
        <div className={styles.docGrid}>
          {DOC_SECTIONS.map((section) => (
            <div className={styles.docColumn} key={section.title}>
              <h3 className={styles.docColumnTitle}>{section.title}</h3>
              <ul className={styles.docList}>
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const LOGOS = [
  {src: 'img/logos/vite-logo.png', alt: 'Vite'},
  {src: 'img/logos/webpack-logo.png', alt: 'Webpack'},
  {src: 'img/logos/webcomponents.png', alt: 'Web Components'},
];

function Logo({src, alt}: {src: string; alt: string}) {
  return (
    <span className={styles.logoChip} title={alt}>
      <img className={styles.logo} src={useBaseUrl(src)} alt={alt} />
    </span>
  );
}

function Ecosystem() {
  return (
    <section className={styles.sectionNarrow}>
      <p className={styles.ecosystemLabel}>
        Composing web interfaces with Module Federation? Frontends served
        by Flightroom keep their versions, canary releases and one-click
        rollback, with templates for Vite, Webpack and Web Components.
      </p>
      <div className={styles.logoRow}>
        {LOGOS.map((logo) => (
          <Logo key={logo.alt} {...logo} />
        ))}
      </div>
      <Link className={styles.inlineLink} to="/docs/frontends/quick-start">
        Frontend quick start →
      </Link>
    </section>
  );
}

function Hosting() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.kicker}>Two ways to run it</span>
        <Heading as="h2" className={styles.sectionTitle}>
          Hosted console or your own infrastructure
        </Heading>
      </div>
      <div className={styles.planGrid}>
        <div className={styles.planCard}>
          <h3 className={styles.planTitle}>Hosted console</h3>
          <p className={styles.planSubtitle}>
            Nothing to install, always up to date
          </p>
          <ul className={styles.checkList}>
            <li>Sign in with email or Google</li>
            <li>Bring your own AI model</li>
            <li>Used throughout the tutorial</li>
          </ul>
          <Link className={styles.buttonGhostBlock} to={CONSOLE_URL}>
            Open the console ↗
          </Link>
        </div>
        <div className={styles.planCard}>
          <h3 className={styles.planTitle}>Self-hosted</h3>
          <p className={styles.planSubtitle}>Your infrastructure, your data</p>
          <ul className={styles.checkList}>
            <li>Helm on your Kubernetes, Docker Compose, Docker or Terraform</li>
            <li>Bring your own MongoDB and Redis</li>
            <li>SSO with Microsoft Entra ID, Google or Auth0</li>
          </ul>
          <Link
            className={styles.buttonGhostBlock}
            to="/docs/self-hosting/helm">
            Installation guides →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Help() {
  return (
    <section className={styles.sectionNarrow}>
      <div className={styles.helpPanel}>
        <div>
          <h2 className={styles.helpTitle}>Not sure where to start?</h2>
          <p className={styles.helpText}>
            The quick start takes you from an empty account to an app the AI
            wrote in your repositories, reviewed and deployed. If something is
            missing or wrong in these pages, open an issue — every page has an
            “Edit this page” link at the bottom.
          </p>
        </div>
        <div className={styles.helpActions}>
          <Link className={styles.buttonPrimary} to="/docs/quick-start">
            Quick start →
          </Link>
          <Link className={styles.buttonGhost} to={GITHUB_URL}>
            GitHub ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Apps and AI agents, built by anyone, shipped in one click"
      description="Documentation for Flightroom: build apps and AI agents by describing them, review the AI's changes in your repositories, and deploy to Kubernetes with Argo CD. Hosted or self-hosted.">
      <Head>
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">
          {JSON.stringify(STRUCTURED_DATA)}
        </script>
      </Head>
      <Hero />
      <main>
        <StartHere />
        <Capabilities />
        <HowItWorks />
        <DocIndex />
        <Ecosystem />
        <Hosting />
        <Help />
      </main>
    </Layout>
  );
}
