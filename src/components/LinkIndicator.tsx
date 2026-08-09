import { AnimatePresence, motion } from 'framer-motion'
import type { LinkStatus } from '../lib/realtime'
import './LinkIndicator.scss'

export default function LinkIndicator({ status }: { status: LinkStatus }) {
  return (
    <AnimatePresence>
      {status !== 'live' && (
        <motion.div
          key={status}
          className={`link-ind link-ind--${status}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
        >
          <span className="link-ind__dot" />
          <span className="link-ind__text">
            {status === 'offline' ? 'Hors ligne' : 'Reconnexion'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
