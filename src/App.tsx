import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Container, CssBaseline, Paper, Stack, ThemeProvider, Typography, createTheme } from '@mui/material';

const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() || '';
const pricingTableId = (import.meta.env.VITE_STRIPE_PRICING_TABLE_ID as string | undefined)?.trim() || '';
const stripePricingTableScriptId = 'stripe-pricing-table-script';

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
  },
  shape: {
    borderRadius: 18,
  },
});

function useStripePricingTableScript() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  useEffect(() => {
    if (!pricingTableId || !publishableKey) {
      setScriptError('Missing Stripe pricing table configuration.');
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
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setScriptError('Unable to load Stripe pricing table script.');
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  return useMemo(
    () => ({
      scriptLoaded,
      scriptError,
    }),
    [scriptLoaded, scriptError],
  );
}

function App() {
  const { scriptLoaded, scriptError } = useStripePricingTableScript();
  const configError = !pricingTableId || !publishableKey;

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
        <Container maxWidth={false} sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, sm: 3, md: 4 } }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 1280,
              mx: 'auto',
              p: { xs: 2.5, md: 4 },
              border: '1px solid rgba(11, 93, 122, 0.10)',
              background: 'rgba(255,255,255,0.94)',
              boxShadow: '0 12px 30px rgba(20, 49, 61, 0.08)',
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 1.25 }}>
                  Choose your plan
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 860 }}>
                  Please select a subscription plan that best fits your needs. You can change or cancel your plan at any time. Our team is here to help if you have any questions about our plans or need assistance in choosing the right one for you.
                </Typography>
              </Box>

              {configError ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Set VITE_STRIPE_PUBLISHABLE_KEY and VITE_STRIPE_PRICING_TABLE_ID in your environment to render the Stripe pricing table.
                </Alert>
              ) : null}

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
                  <stripe-pricing-table
                    pricing-table-id={pricingTableId}
                    publishable-key={publishableKey}
                  />
                </Box>
              ) : null}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
