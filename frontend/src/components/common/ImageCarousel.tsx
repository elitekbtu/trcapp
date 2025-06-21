import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageCarouselProps {
  images: string[]
  className?: string
  aspectClassName?: string // utility class for aspect ratio wrapper
}

const swipeConfidenceThreshold = 10000 // Adjust as needed

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, className = '', aspectClassName = 'aspect-square' }) => {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0])

  if (images.length === 0) {
    return null
  }

  const imageIndex = ((page % images.length) + images.length) % images.length

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 })
  }

  const paginate = (newDir: number) => {
    setPage([page + newDir, newDir])
  }

  return (
    <div className={`relative overflow-hidden ${aspectClassName} ${className}`}>{
      /* Wrapper for correct aspect ratio */
    }
      <AnimatePresence custom={direction} initial={false}>
        <motion.img
          key={imageIndex}
          src={images[imageIndex]}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, { offset, velocity }) => {
            const swipePower = Math.abs(offset.x) * velocity.x
            if (swipePower < -swipeConfidenceThreshold) {
              paginate(1)
            } else if (swipePower > swipeConfidenceThreshold) {
              paginate(-1)
            }
          }}
          className="h-full w-full object-cover select-none"
        />
      </AnimatePresence>
    </div>
  )
}

export default ImageCarousel 