export const getTranslatedApiError = (error, t) => {
  const status = error?.response?.status;
  const rawMessage = error?.response?.data?.message || error?.message || '';
  const normalized = String(rawMessage).toLowerCase();

  if (status === 401 || /invalid credentials|invalid email|incorrect email|wrong password|incorrect password|invalid password/.test(normalized)) {
    return t('errors.invalidCredentials');
  }

  if (status === 403 || /forbidden|permission denied/.test(normalized)) {
    return t('errors.forbidden');
  }

  if (status === 404 || /not found|does not exist/.test(normalized)) {
    return t('errors.notFound');
  }

  if (status === 409 || /already exists|already registered|duplicate/.test(normalized)) {
    return t('errors.emailExists');
  }

  if (/otp|verification|incorrect code/.test(normalized)) {
    return t('errors.invalidOtp');
  }

  if (/session expired|token expired/.test(normalized)) {
    return t('errors.sessionExpired');
  }

  return t('errors.somethingWentWrong');
};
