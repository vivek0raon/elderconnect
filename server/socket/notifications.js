import { getIO } from './socket.js';

export const emitBookingUpdate = (userId, booking) => {
  try {
    const io = getIO();
    io.to(String(userId)).emit('bookingUpdate', booking);
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};

export const emitNewBooking = (caretakerId, booking) => {
  try {
    const io = getIO();
    io.to(String(caretakerId)).emit('newBooking', booking);
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};

export const emitReviewNotification = (caretakerId, review) => {
  try {
    const io = getIO();
    io.to(String(caretakerId)).emit('newReview', review);
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};
