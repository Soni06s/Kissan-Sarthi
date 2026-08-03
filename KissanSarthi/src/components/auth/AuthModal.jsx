import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';

const AuthModal = ({ onClose, onLoginSuccess }) => {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000
        }}>
            <Card style={{ width: '90%', maxWidth: 420, padding: 35, position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Icon name="close" size={20} color={COLORS.textMuted} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <div style={{ width: 60, height: 60, background: COLORS.primary + '10', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                        <img src="https://play-lh.googleusercontent.com/vqzU2KZDlcjS6dONFjSZjgfKqpwDoZsyrrse6ZAKeb1FejH_hQ4-VZbt6Ljkrnqs2UX1=w480-h960-rw" alt="logo" style={{ width: '70%' }} />
                    </div>
                    <h2 style={{ fontSize: 26, fontWeight: 900, color: COLORS.text, margin: 0 }}>{isLogin ? t('auth.modalWelcomeBack') : t('auth.modalRegisterFarm')}</h2>
                    <p style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 8 }}>{t('auth.modalSecureAccess')}</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onLoginSuccess(); }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {!isLogin && (
                        <input type="text" placeholder={t('auth.fullName')} required style={{ padding: '14px 18px', borderRadius: 14, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                    )}

                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: COLORS.primary, fontSize: 14 }}>+91</span>
                        <input type="tel" placeholder={t('auth.mobileNumber')} required style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: 14, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                    </div>

                    <input type="password" placeholder={t('auth.password')} required style={{ padding: '14px 18px', borderRadius: 14, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14 }} />

                    <button type="submit" style={{
                        marginTop: 10, padding: '16px', borderRadius: 14, border: 'none',
                        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                        color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                        boxShadow: `0 10px 20px ${COLORS.primary}44`
                    }}>
                        {isLogin ? t('auth.signInToTerminal') : t('auth.initializeAccount')}
                    </button>
                </form>

                <div style={{ marginTop: 25, textAlign: 'center', fontSize: 14, color: COLORS.textMuted }}>
                    {isLogin ? t('auth.newFarmer') : t('auth.alreadyRegistered')} {' '}
                    <span onClick={() => setIsLogin(!isLogin)} style={{ color: COLORS.primary, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>
                        {isLogin ? t('auth.createAccount') : t('auth.loginNow')}
                    </span>
                </div>
            </Card>
        </div>
    );
};

export default AuthModal;