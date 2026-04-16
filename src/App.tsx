import { FormEvent, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

type ViewId = 'account' | 'pricing' | 'confirmation';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  password: string;
  confirmPassword: string;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  recommended?: boolean;
};

type PersistedCheckoutData = {
  form: FormState;
  selectedPlanId: string;
};

const STORAGE_KEY = 'stripe-poc-checkout-data';
const stripePricingTableScriptId = 'stripe-pricing-table-script';
const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() || '';
const pricingTableId = (import.meta.env.VITE_STRIPE_PRICING_TABLE_ID as string | undefined)?.trim() || '';

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$19',
    cadence: 'per month',
    description: 'For small teams getting up and running quickly.',
    features: ['1 workspace', 'Basic reporting', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$49',
    cadence: 'per month',
    description: 'Best fit for the POC and growing teams.',
    features: ['Unlimited workspaces', 'Advanced reporting', 'Priority support'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    cadence: 'per month',
    description: 'For larger teams that need more control.',
    features: ['Custom onboarding', 'Dedicated support', 'Usage controls'],
  },
];

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B5D7A',
      dark: '#083F52',
      light: '#7BB9CE',
    },
    secondary: {
      main: '#7EC8D9',
    },
    background: {
      default: '#EFF5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#14313D',
      secondary: '#59717B',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Trebuchet MS, Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 18,
  },
});

function loadCheckoutData(): PersistedCheckoutData | null {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as PersistedCheckoutData;
  } catch {
    return null;
  }
}

function saveCheckoutData(data: PersistedCheckoutData) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function useStripePricingTableScript() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  useEffect(() => {
    if (!pricingTableId || !publishableKey) {
      setScriptError('Missing Stripe pricing table configuration.');
      return;
    }

    const existingScript = document.getElementById(stripePricingTableScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      if (customElements.get('stripe-pricing-table')) {
        setScriptLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = stripePricingTableScriptId;
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError('Unable to load Stripe pricing table script.');

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  return { scriptLoaded, scriptError };
}

function App() {
  const { scriptLoaded, scriptError } = useStripePricingTableScript();
  const [view, setView] = useState<ViewId>('account');
  const [selectedPlanId, setSelectedPlanId] = useState('professional');
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const hash = window.location.hash.replace('#', '').replace(/^\//, '');
    if (hash === 'confirmation') {
      setView('confirmation');
      const persisted = loadCheckoutData();
      if (persisted) {
        setForm(persisted.form);
        setSelectedPlanId(persisted.selectedPlanId);
      }
      return;
    }

    const persisted = loadCheckoutData();
    if (persisted) {
      setForm(persisted.form);
      setSelectedPlanId(persisted.selectedPlanId);
    }
  }, []);

  const isAccountStepValid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.mobilePhone.trim().length > 0 &&
    form.password.trim().length >= 6 &&
    form.password === form.confirmPassword;
  const showPasswordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const configError = !pricingTableId || !publishableKey;

  const handleAccountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAccountStepValid) {
      return;
    }

    saveCheckoutData({ form, selectedPlanId });
    setView('pricing');
  };

  const goToConfirmation = () => {
    saveCheckoutData({ form, selectedPlanId });
    window.location.hash = '/confirmation';
    setView('confirmation');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(126, 200, 217, 0.28), transparent 36%), linear-gradient(180deg, #F8FBFC 0%, #EEF4F7 100%)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              border: '1px solid rgba(11, 93, 122, 0.10)',
              background: 'rgba(255,255,255,0.96)',
              boxShadow: '0 12px 30px rgba(20, 49, 61, 0.08)',
            }}
          >
            {view === 'account' ? (
              <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
                <Stack spacing={3.25}>
                  <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 44 }, mb: 1 }}>
                      Create your account
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 760 }}>
                      Capture the basic details first, then move to the Stripe pricing table. The confirmation screen can be opened directly from Stripe checkout.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, sm: 2.5 }, flexWrap: 'wrap' }}>
                    <Box sx={{ px: 1.4, py: 0.6, borderRadius: 999, bgcolor: 'primary.main', color: 'white', fontWeight: 800 }}>1 Account</Box>
                    <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300', maxWidth: 160 }} />
                    <Box sx={{ px: 1.4, py: 0.6, borderRadius: 999, bgcolor: 'grey.300', color: 'text.secondary', fontWeight: 800 }}>2 Pricing</Box>
                    <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300', maxWidth: 160 }} />
                    <Box sx={{ px: 1.4, py: 0.6, borderRadius: 999, bgcolor: 'grey.300', color: 'text.secondary', fontWeight: 800 }}>3 Confirmation</Box>
                  </Box>

                  <Box component="form" onSubmit={handleAccountSubmit}>
                    <Stack spacing={2.25}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.25 }}>
                        <TextField
                          fullWidth
                          label="First Name"
                          placeholder="First Name"
                          value={form.firstName}
                          onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                        />
                        <TextField
                          fullWidth
                          label="Last Name"
                          placeholder="Last Name"
                          value={form.lastName}
                          onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                        />
                        <TextField
                          fullWidth
                          label="Email"
                          placeholder="Email"
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        />
                        <TextField
                          fullWidth
                          label="Mobile Phone"
                          placeholder="Mobile phone"
                          value={form.mobilePhone}
                          onChange={(event) => setForm((current) => ({ ...current, mobilePhone: event.target.value }))}
                        />
                        <TextField
                          fullWidth
                          label="Password"
                          placeholder="Password"
                          type="password"
                          value={form.password}
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                          error={form.password.length > 0 && form.password.length < 6}
                          helperText={form.password.length > 0 && form.password.length < 6 ? 'Use at least 6 characters.' : ' '}
                        />
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          placeholder="Confirm password"
                          type="password"
                          value={form.confirmPassword}
                          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                          error={showPasswordMismatch}
                          helperText={showPasswordMismatch ? 'Passwords do not match.' : ' '}
                        />
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          endIcon={<ArrowForwardIcon />}
                          disabled={!isAccountStepValid}
                          sx={{ minWidth: 220, py: 1.35 }}
                        >
                          Next
                        </Button>
                      </Stack>

                      {!isAccountStepValid ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Fill in the account details to continue to the plan step.
                        </Alert>
                      ) : null}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ) : null}

            {view === 'pricing' ? (
              <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
                <Stack spacing={3.25}>
                  <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, mb: 1 }}>
                      Choose your plan
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 840 }}>
                      Select a plan here, then use the Stripe pricing table to complete checkout. After payment, redirect to the confirmation screen.
                    </Typography>
                  </Box>

                  {configError ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Set VITE_STRIPE_PUBLISHABLE_KEY and VITE_STRIPE_PRICING_TABLE_ID in your environment to render the Stripe pricing table.
                    </Alert>
                  ) : null}

                  <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                    <Stack spacing={1.5}>

                      {scriptError ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                          {scriptError}
                        </Alert>
                      ) : null}

                      {!configError && !scriptError && !scriptLoaded ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Loading Stripe pricing table...
                        </Alert>
                      ) : null}

                      {!configError && !scriptError ? (
                        <Box sx={{ overflow: 'hidden', borderRadius: 3 }}>
                          <stripe-pricing-table pricing-table-id={pricingTableId} publishable-key={publishableKey} />
                        </Box>
                      ) : null}
                    </Stack>
                  </Paper>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button variant="outlined" size="large" onClick={() => setView('account')} sx={{ minWidth: 160, py: 1.35 }}>
                      Back
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : null}

            {view === 'confirmation' ? (
              <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
                <Stack spacing={3} sx={{ maxWidth: 840, mx: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 76,
                        height: 76,
                        borderRadius: '999px',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'rgba(11, 93, 122, 0.10)',
                        color: 'primary.main',
                      }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 46 }} />
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 1 }}>
                      Payment completed
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      Your organization is now active. Explore the dashboard and manage your subscription from your account settings.
                    </Typography>
                  </Box>

                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Payment Success - Plan: {selectedPlanId.charAt(0).toUpperCase() + selectedPlanId.slice(1)}, Email: {form.email}
                  </Alert>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                    <Button variant="contained" size="large" onClick={() => setView('account')} sx={{ minWidth: 220, py: 1.35 }}>
                      Start over
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : null}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
