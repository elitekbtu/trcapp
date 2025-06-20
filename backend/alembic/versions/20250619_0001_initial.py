from alembic import op
import sqlalchemy as sa

revision = '20250619_0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )

    op.create_table(
        'items',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, index=True),
        sa.Column('brand', sa.String()),
        sa.Column('color', sa.String()),
        sa.Column('image_url', sa.String()),
        sa.Column('description', sa.String()),
        sa.Column('price', sa.Float()),
        sa.Column('category', sa.String()),
    )

    op.create_table(
        'outfits',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, index=True),
        sa.Column('style', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('owner_id', sa.String(), nullable=False, index=True),
    )


def downgrade():
    op.drop_table('outfits')
    op.drop_table('items')
    op.drop_table('users') 