import authOptions from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';

// req to update username from profile /route into mongo db usiing connectToDatabase and User model

export async function PUT(req) {
    try {
        const body = await req.json();
        const { username } = body;
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response(JSON.stringify({ error: 'User not Logged In' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await connectToDatabase();
        const user = await User.findById(session.user.id);
        user.username = username;
        await user.save();
        return new Response(JSON.stringify({ user, message: 'Username updated successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating username:', error);
        return new Response(JSON.stringify({ error: 'Failed to update username' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
